/**
 * Kit Model — Mongoose schema for persisting interview prep kits.
 */
import mongoose, { Schema } from 'mongoose';
const pipelineStepSchema = new Schema({
    step: Number,
    label: String,
    status: { type: String, enum: ['pending', 'running', 'done', 'failed'] },
    detail: String,
}, { _id: false });
const kitSchema = new Schema({
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
export const KitModel = mongoose.model('Kit', kitSchema);
//# sourceMappingURL=Kit.js.map