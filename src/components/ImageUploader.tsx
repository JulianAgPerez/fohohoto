import React, { useState } from "react";
import { Cloudinary, Transformation } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { Resize } from "@cloudinary/url-gen/actions/resize";
import { Position } from "@cloudinary/url-gen/qualifiers/position";
import { Gravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { Overlay } from "@cloudinary/url-gen/actions/overlay";
import { image } from "@cloudinary/url-gen/qualifiers/source";
import { generativeBackgroundReplace } from "@cloudinary/url-gen/actions/effect";

const cloud_name = import.meta.env.VITE_CLOUDNAME as string;
const upload_preset = "upload-unsigned_presets";
const folder = "Fohohoto/";

const backgrounds = [
  { key: "christmas", description: "Add a christmas background" },
  {
    key: "snow",
    description: "Add snow and a christmas tree to the background",
  },
  { key: "trees", description: "Add some pines with snow to the background" },
];

const ImageUploader: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [transformedImageId, setTransformedImageId] = useState<string | null>(
    null
  );
  const [selectedBackground, setSelectedBackground] = useState<string>(
    backgrounds[0].key
  );
  const cld = new Cloudinary({ cloud: { cloudName: cloud_name } });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setImageFile(files[0]);
    }
  };

  const handleUploadAndTransform = async () => {
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("upload_preset", upload_preset);

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setImageId(data.public_id);

        const transformedUrl = applyChristmasEffects(
          data.public_id,
          selectedBackground
        );
        setTransformedImage(transformedUrl);
        const url = new URL(transformedUrl);
        const transformedImageId = url.pathname.split("/").pop();
        setTransformedImageId(transformedImageId!);
        console.log("Image uploaded and transformed:", data);
        console.log("Transformed image URL:", transformedUrl);
        console.log("Transformed image ID:", transformedImageId);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };

  const applyChristmasEffects = (imageId: string, background: string) => {
    const cldImage = cld.image(imageId);

    cldImage
      .resize(Resize.fill().width(500).height(500))
      .effect(generativeBackgroundReplace().prompt(background))

      .format("auto")
      .quality("auto")
      .addFlag("lossy");
    return cldImage.toURL();
  };
  return (
    <div className="image-uploader p-4">
      <h1 className="text-2xl font-bold mb-4">Sube tu imagen navideña 🎄</h1>
      <input
        type="file"
        onChange={handleFileChange}
        className="mb-4 border p-2"
      />
      <select
        value={selectedBackground}
        onChange={(e) => setSelectedBackground(e.target.value)}
        className="mb-4 border p-2"
      >
        {backgrounds.map((bg) => (
          <option key={bg.key} value={bg.key}>
            {bg.description}
          </option>
        ))}
      </select>
      <button
        onClick={handleUploadAndTransform}
        className="mb-4 border p-2 bg-blue-500 text-white"
      >
        Subir y Transformar Imagen
      </button>
      <div className="flex flex-wrap gap-4">
        {/*Imagen original */}
        {imageId && (
          <div className="w-1/2 h-52">
            <AdvancedImage
              cldImg={cld.image(imageId)}
              style={{ width: 300, height: 300, objectFit: "cover" }}
            />
          </div>
        )}
        {/*Imagen transformada */}

        {transformedImage && (
          <div className="w-1/2 h-52">
            <AdvancedImage
              cldImg={cld.image(transformedImageId!)}
              style={{ width: 300, height: 300, objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export default ImageUploader;
