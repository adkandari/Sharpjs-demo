// pages/api/upload.ts

import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import multer from "multer";
import fs from "fs/promises";
import sharp from "sharp";

interface NextApiRequestWithFile extends NextApiRequest {
  file: any; // Depending on your setup, consider defining a more specific type
}

const upload = multer({ dest: "./uploads/" });

const uploadMiddleware = upload.single("file");

const handler: NextApiHandler = async (
  req: NextApiRequestWithFile,
  res: NextApiResponse,
) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
    return;
  }

  await new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });

  const { file } = req;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const newPath = `./public/${file.originalname}`;

  try {
    const { width, height } = await sharp(file.path).metadata();
    await sharp(file.path)
      .resize({
        //width: 1024,
        width: Math.round(width * 0.2),
        height: Math.round(height * 0.2),
      })
      // .jpeg({ quality: 100 })
      .toFile(newPath);
    await fs.unlink(file.path);
    res.status(200).json({
      message: "Image uploaded and processed successfully",
      url: newPath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing your image" });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
