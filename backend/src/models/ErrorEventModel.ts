import mongoose, { Document, Schema } from 'mongoose';
import { ErrorEvent } from './ErrorEvent';

export interface ErrorEventDocument extends ErrorEvent, Document {}

const errorEventSchema = new Schema<ErrorEventDocument>(
  {
    timestamp: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    browser: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      index: true,
    },
    errorMessage: {
      type: String,
      required: true,
    },
    stackTrace: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'error_events',
  }
);

export const ErrorEventModel = mongoose.model<ErrorEventDocument>(
  'ErrorEvent',
  errorEventSchema
);
