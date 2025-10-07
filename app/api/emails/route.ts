import dbConnect from "@/lib/db.config";
import { EmailModel } from "@/models/email.model";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();

        if (!body?.name || !body?.html) {
            const missing = !body?.name ? "name" : "html";
            return NextResponse.json({ error: `${missing} is missing` }, { status: 400 });
        }

        await dbConnect();

        const exist = await EmailModel.findOne({ name: body.name });
        if (exist)
            return NextResponse.json({ error: "Name already exists" }, { status: 400 });

        await EmailModel.create({
            id: body.id,
            name: body.name,
            html: body.html,
        });

        return NextResponse.json({ message: "Email template created successfully" }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};


export const GET = async () => {
    try {
        await dbConnect();
        const emails = await EmailModel.find().sort({ createdAt: -1 });
        return NextResponse.json(emails, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};

export const PATCH = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { id, name, html } = body;

        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        await dbConnect();

        const updated = await EmailModel.findByIdAndUpdate(
            id,
            { name, html },
            { new: true }
        );

        if (!updated) return NextResponse.json({ error: "Email not found" }, { status: 404 });

        return NextResponse.json({ message: "Email updated successfully", data: updated }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};


export const DELETE = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const id = body?.id;

        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        await dbConnect();

        const deleted = await EmailModel.findOneAndDelete({ _id:id });

        if (!deleted) return NextResponse.json({ error: "Email not found" }, { status: 404 });

        return NextResponse.json({ message: "Email deleted successfully" }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};
