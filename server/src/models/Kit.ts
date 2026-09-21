/**
 * Kit Model — Mongoose schema for persisting interview prep kits.
 */

import mongoose, { Document, Schema } from 'mongoose';
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

const pipelineStepSchema = new Schema({
  step: Number,
  label: String,
  status: { type: String, enum: ['pending', 'running', 'done', 'failed'] },
  detail: String,
}, { _id: false });

const kitSchema = new Schema<IKit>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['generating', 'ready', 'failed'],
    default: 'generating',
  },
  progress: [pipelineStepSchema],
  jobDescription: {
    type: String,
    required: true,
  },
  companyUrl: {
    type: String,
    required: true,
  },
  daysAvailable: {
    type: Number,
    required: true,
    min: 1,
  },
  kit: {
    type: Schema.Types.Mixed,
    default: null,
  },
  editState: {
    type: Schema.Types.Mixed,
    default: {},
  },
  practiceState: {
    type: Schema.Types.Mixed,
    default: {},
  },
  jdHash: {
    type: String,
    index: true,
  },
  errorMessage: String,
}, {
  timestamps: true,
});

// Index for finding user's kits
kitSchema.index({ userId: 1, createdAt: -1 });

// Index for deduplication
kitSchema.index({ userId: 1, jdHash: 1 });

export const KitModel = mongoose.model<IKit>('Kit', kitSchema);
