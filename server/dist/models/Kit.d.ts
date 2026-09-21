/**
 * Kit Model — Mongoose schema for persisting interview prep kits.
 */
import mongoose, { Document } from 'mongoose';
import type { Kit, KitEditState, PracticeState, PipelineStep } from '../../../shared/types/kit.js';
export interface IKit extends Document {
    userId: mongoose.Types.ObjectId;
    status: 'generating' | 'ready' | 'failed';
    progress: PipelineStep[];
    jobDescription: string;
    companyUrl: string;
    daysAvailable: number;
    kit: Kit | null;
    editState: KitEditState;
    practiceState: PracticeState;
    jdHash: string;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const KitModel: mongoose.Model<IKit, {}, {}, {}, mongoose.Document<unknown, {}, IKit, {}, {}> & IKit & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
