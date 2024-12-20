import React, { useState } from "react";
import { Cloudinary, Transformation } from "@cloudinary/url-gen";
import { Position } from "@cloudinary/url-gen/qualifiers/position";
import { Gravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { AdvancedImage } from "@cloudinary/react";
import { Overlay, Resize } from "@cloudinary/url-gen/actions";
import { Source } from "@cloudinary/url-gen/qualifiers/source";

const cloud_name = import.meta.env.VITE_CLOUDNAME as string;
const upload_preset = "upload-unsigned_presets";

const backgrounds = ["bg4-min_e4fvtg", "bg1-min_yuud79", "bg3-min_jhpgza"];

const ImageUploader: React.FC = () => {
  const [imageId, setImageId] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(
    backgrounds[0]
  );

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files[0]) {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("upload_preset", upload_preset);

      // Subir la imagen a Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      setImageId(data.public_id);

      // Generar URL transformada
      const transformedUrl = applyChristmasEffects(
        data.public_id,
        selectedBackground
      );
      setTransformedImage(transformedUrl);
    }
  };

  const applyChristmasEffects = (imageId: string, background: string) => {
    const cld = new Cloudinary({
      cloud: { cloudName: cloud_name },
      url: { secure: true },
    });

    const cldImage = cld.image(imageId);

    cldImage
      .resize(Resize.fill().width(500).height(500))
      .overlay(
        Overlay.source(
          Source.image(background).transformation(
            new Transformation().resize(Resize.fill().width(500).height(500))
          )
        )
      )
      .overlay(
        Overlay.source(
          Source.image("pngwing.com-min_hqpcyl").transformation(
            new Transformation().resize(Resize.fill().width(100).height(100))
          )
        ).position(
          new Position()
            .gravity(Gravity.compass("north_east"))
            .offsetX(10)
            .offsetY(10)
        )
      )
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
        onChange={handleImageUpload}
        className="mb-4 border p-2"
      />
      <select
        value={selectedBackground}
        onChange={(e) => setSelectedBackground(e.target.value)}
        className="mb-4 border p-2"
      >
        {backgrounds.map((bg) => (
          <option key={bg} value={bg}>
            {bg}
          </option>
        ))}
      </select>
      {imageId && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Imagen Original:</h2>
          <AdvancedImage
            cldImg={
              new Cloudinary({
                cloud: { cloudName: cloud_name },
              }).image(imageId) as any
            }
          />
        </div>
      )}
      {transformedImage && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Imagen Navideña:</h2>
          <img src={transformedImage} alt="Imagen Navideña" />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
