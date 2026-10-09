import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Secure file streaming
router.get('/files/:fileName', documentController.serveFile as any);

router.use(authenticate as any);

router.post('/upload', upload.single('file'), documentController.upload as any);
router.get('/patient/:patientId', documentController.list as any);
router.get('/:id', documentController.getOne as any);
router.delete('/:id', documentController.delete as any);

export default router;
