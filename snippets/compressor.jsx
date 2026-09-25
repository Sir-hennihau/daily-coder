import { useEffect, useState } from "react";

import imageCompression from "browser-image-compression";

import Card from "react-bootstrap/Card";

const PLACEHOLDER =
    "http://navparivartan.in/wp-content/uploads/2018/11/placeholder.png";

const COMPRESSION_OPTIONS = {
    maxSizeMB: 1,
    maxWidthOrHeight: 500,
    useWebWorker: true,
};

// An object URL keeps its file in memory until revoked,
// so free it once the file changes.
function useObjectUrl(file) {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        if (!file) {
            setUrl(null);
            return undefined;
        }

        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return url;
}

export default function ImageCompressor() {
    const [original, setOriginal] = useState(null);
    const [compressed, setCompressed] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const originalUrl = useObjectUrl(original);
    const compressedUrl = useObjectUrl(compressed);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setOriginal(file);
        setCompressed(null);
    };

    const handleCompress = async () => {
        const sizeInMB = original.size / 1024 / 1024;
        if (sizeInMB <= COMPRESSION_OPTIONS.maxSizeMB) {
            alert("Image is too small, can't be compressed!");
            return;
        }

        setIsCompressing(true);
        try {
            setCompressed(
                await imageCompression(original, COMPRESSION_OPTIONS)
            );
        } catch (error) {
            console.error(error);
            alert("Compression failed, please try another image.");
        } finally {
            setIsCompressing(false);
        }
    };

    return (
        <div className="m-5">
            <div className="text-light text-center">
                <h1>Three Simple Steps</h1>
                <h3>1. Upload Image</h3>
                <h3>2. Click on Compress</h3>
                <h3>3. Download Compressed Image</h3>
            </div>

            <div className="row mt-5">
                <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                    <Card.Img
                        className="ht"
                        variant="top"
                        src={originalUrl ?? PLACEHOLDER}
                    />
                    <div className="d-flex justify-content-center">
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-2 btn btn-dark w-75"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <div className="col-xl-4 col-lg-4 col-md-12 mb-5 mt-5 col-sm-12 d-flex justify-content-center align-items-baseline">
                    {original && (
                        <button
                            type="button"
                            className="btn btn-dark"
                            disabled={isCompressing}
                            onClick={handleCompress}
                        >
                            {isCompressing ? "Compressing…" : "Compress"}
                        </button>
                    )}
                </div>

                <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12 mt-3">
                    <Card.Img
                        variant="top"
                        src={compressedUrl ?? PLACEHOLDER}
                    />
                    {compressedUrl && (
                        <div className="d-flex justify-content-center">
                            <a
                                href={compressedUrl}
                                download={original.name}
                                className="mt-2 btn btn-dark w-75"
                            >
                                Download
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
