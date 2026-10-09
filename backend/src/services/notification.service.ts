import mongoose from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';
import { Patient } from '../models/Patient';
import { User } from '../models/User';
import { fcmService } from './fcm.service';
import { NotificationType, NotificationChannel } from '../types';

let ioInstance: any = null;

export class NotificationService {
  public setSocketIO(io: any) {
    ioInstance = io;
  }

  public getSocketIO() {
    return ioInstance;
  }

  /**
   * Broadcast real-time update and save in-app notification
   */
  public async createNotification(data: {
    recipientUserId: string;
    patientId?: string;
    type: NotificationType;
    title: string;
    body: string;
    payload?: Record<string, any>;
    channel?: NotificationChannel;
  }): Promise<INotification> {
    const notif = new Notification({
      recipientUserId: new mongoose.Types.ObjectId(data.recipientUserId),
      patientId: data.patientId ? new mongoose.Types.ObjectId(data.patientId) : undefined,
      type: data.type,
      title: data.title,
      body: data.body,
      payload: data.payload,
      channel: data.channel || 'IN_APP',
      read: false
    });

    await notif.save();

    // Emit live WebSocket event
    if (ioInstance) {
      ioInstance.to(`user:${data.recipientUserId}`).emit('notification', notif);
      if (data.patientId) {
        ioInstance.to(`patient:${data.patientId}`).emit('patient_update', {
          type: data.type,
          notification: notif
        });
      }
    }

    // Try FCM push if recipient has token
    const recipientUser = await User.findById(data.recipientUserId);
    if (recipientUser?.fcmToken) {
      await fcmService.sendNotification({
        token: recipientUser.fcmToken,
        title: data.title,
        body: data.body,
        data: {
          type: data.type,
          patientId: data.patientId || ''
        }
      });
    }

    return notif;
  }

  /**
   * Notify all linked caregivers for a given patient
   */
  public async notifyCaregiversForPatient(
    patientId: string,
    type: NotificationType,
    title: string,
    body: string,
    payload?: Record<string, any>
  ): Promise<INotification[]> {
    const links = await CaregiverPatientLink.find({
      patientId: new mongoose.Types.ObjectId(patientId),
      status: 'active'
    });

    const notifs: INotification[] = [];
    for (const link of links) {
      const n = await this.createNotification({
        recipientUserId: link.caregiverId.toString(),
        patientId,
        type,
        title,
        body,
        payload
      });
      notifs.push(n);
    }
    return notifs;
  }

  /**
   * Notify senior phone directly
   */
  public async notifySenior(
    patientId: string,
    type: NotificationType,
    title: string,
    body: string,
    payload?: Record<string, any>
  ): Promise<INotification | null> {
    const patient = await Patient.findById(patientId);
    if (!patient || !patient.linkedUserId) return null;

    return this.createNotification({
      recipientUserId: patient.linkedUserId.toString(),
      patientId,
      type,
      title,
      body,
      payload,
      channel: 'PUSH'
    });
  }

  public async getNotificationsForUser(
    userId: string,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; unreadCount: number }> {
    const notifications = await Notification.find({
      recipientUserId: new mongoose.Types.ObjectId(userId)
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipientUserId: new mongoose.Types.ObjectId(userId),
      read: false
    });

    return { notifications, unreadCount };
  }

  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.updateOne(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        recipientUserId: new mongoose.Types.ObjectId(userId)
      },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      {
        recipientUserId: new mongoose.Types.ObjectId(userId),
        read: false
      },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  }
}

export const notificationService = new NotificationService();
