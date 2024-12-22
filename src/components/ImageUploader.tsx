import React, { useState } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { generativeBackgroundReplace } from "@cloudinary/url-gen/actions/effect";
import { scale } from "@cloudinary/url-gen/actions/resize";
import { desc } from "motion/react-client";

const cloud_name = import.meta.env.VITE_CLOUDNAME as string;
const upload_preset = "upload-unsigned_presets";

const backgrounds = [
  { key: "christmas", description: "Add a christmas background" },
  {
    key: "snow",
    description: "Add snow and a Christmas atmosphere to the background",
  },
  {
    key: "Santa Claus",
    description: "Add santa claus in the sky with snow",
  },
  {
    key: "Gifts",
    description: "Add gifts and a christmas tree to the background",
  },
  {
    key: "Elf",
    description: "Add an elf to the background and add me a Christmas hat",
  },
  { key: "Im a Grinch", description: "Add a Grinch to the background" },
];

const ImageUploader: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(
    backgrounds[0].key
  );
  const [loading, setLoading] = useState<boolean>(false);

  const cld = new Cloudinary({ cloud: { cloudName: cloud_name } });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setImageFile(files[0]);
    }
  };

  const handleUploadAndTransform = async () => {
    if (imageFile) {
      setLoading(true);
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
        console.log("Image uploaded and transformed:", data);
        console.log("Transformed image URL:", transformedUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const applyChristmasEffects = (imageId: string, background: string) => {
    const cldImage = cld.image(imageId);

    cldImage
      .effect(generativeBackgroundReplace().prompt(background))
      .resize(scale().width(1000).height(1000))
      .format("auto")
      .quality("auto:best");
    return cldImage.toURL();
  };
  return (
    <div className="flex justify-center items-center h-full bg-blue-900">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-center text-4xl text-red-500 font-bold mb-4">
          Sube tu imagen navideña 🎄
        </h1>
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-4 border p-2 w-full"
        />
        <select
          value={selectedBackground}
          onChange={(e) => setSelectedBackground(e.target.value)}
          className="mb-4 border p-2 w-full"
        >
          {backgrounds.map((bg) => (
            <option key={bg.key} value={bg.key}>
              {bg.description}
            </option>
          ))}
        </select>
        <button
          onClick={handleUploadAndTransform}
          className="mb-4 border p-2 bg-green-500 text-white w-full rounded-lg hover:bg-green-700 transition duration-300"
        >
          Subir y Transformar Imagen
        </button>
        <div className="flex flex-wrap gap-4">
          {/*Imagen original */}
          {imageId && (
            <div className="w-full h-52 border-4 border-green-500 rounded-lg overflow-hidden shadow-lg mb-4 justify-center items-center flex">
              <AdvancedImage
                cldImg={cld.image(imageId)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                }}
              />
            </div>
          )}
          {/*Imagen transformada */}
          <div className="w-full h-52 border-4 border-green-500 rounded-lg overflow-hidden shadow-lg justify-center items-center flex">
            {loading ? (
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-success motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            ) : (
              transformedImage && (
                <img
                  src={transformedImage}
                  alt="Imagen Navideña"
                  onLoad={() => setLoading(false)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
                  }}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ImageUploader;
