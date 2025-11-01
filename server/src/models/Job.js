import { Schema, model } from "mongoose";

const JobSchema = new Schema(
  {
    source: { type: String, required: true },      
    externalId: { type: String, required: true },  
    title: String,
    company: String,
    location: String,
    type: String,                                 
    remote: Boolean,
    description: String,                          
    applyUrl: String,
    publishedAt: Date,
    hash: String,                             
    raw: Schema.Types.Mixed,                    
  },
  { timestamps: true }
);

JobSchema.index({ source: 1, externalId: 1 }, { unique: true });
JobSchema.index({ publishedAt: -1 });


export const Job = model("Job", JobSchema);
