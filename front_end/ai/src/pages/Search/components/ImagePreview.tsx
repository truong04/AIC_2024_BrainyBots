import {Button, Image} from "antd";
import {ImageData} from "@/pages/Search/interface/ImageData";
import {BASE_URL} from "@/constants";
import React from "react";
import {CopyOutlined} from "@ant-design/icons";


interface ImagePreviewProps {
    id: string;
    image: ImageData;
    messageApi?: any;
    copyToClipboard?: any;
}

const ImagePreview = ({id, image, messageApi, copyToClipboard}: ImagePreviewProps) => {
    return (
        <div>
            <div  style={{position: 'relative'}}>
                <Image style={{width: '100%', height: 'auto', objectFit: 'cover'}}
                       src={`${BASE_URL}/keyframes_webp/${image.image_path}`} alt={id}/>
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '2px 5px',
                    fontSize: '10px'
                }}>
                    {image.video_id}
                </div>
                <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '2px 5px',
                    fontSize: '10px'
                }}>
                    {image.frame_id}
                </div>
            </div>
            <Button
                size={'small'}
                type="default"
                onClick={() => {
                    copyToClipboard(image.id);
                    messageApi.open({
                        type: 'success',
                        content: 'Copied! - ' + image.id,
                    });
                }}
                style={{backgroundColor: '#F7446D', color: 'white'}}
            >
                <CopyOutlined/>
            </Button>
        </div>
    );
}

export default ImagePreview;