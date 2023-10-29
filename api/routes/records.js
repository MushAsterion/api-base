import controller from '../controllers/global.js';
import mongoose from 'mongoose';

export default controller(mongoose.models.Records, ['GET']);
