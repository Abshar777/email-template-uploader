import { EmailTemplate } from "@/lib/templates";
import mongoose, { Schema, Document, model, models, Model } from "mongoose";
export type IEmail = EmailTemplate & Document;

export const EmailSchema = new Schema<IEmail>({
   name:{type:String,required:true},
   html:{type:String,required:true},

},{
    timestamps:true
});

export const EmailModel: Model<IEmail> = mongoose.models.Email || mongoose.model<IEmail>("Email", EmailSchema);

