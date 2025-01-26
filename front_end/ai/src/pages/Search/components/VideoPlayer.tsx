import {Button, Modal} from "antd";
import React, {useRef} from "react";
import axios from "@/utils/axios";
import {VideoState} from "@/pages/Search/interface/VideoState";
import {copyToClipboard} from "@/utils/clipboard";

interface VideoPlayerProps {
    videoState: VideoState;
    setVideoState: (videoState: VideoState) => void;
    messageApi: any;
}


const VideoPlayer: React.FC<VideoPlayerProps> = ({videoState, setVideoState, messageApi}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoFPSRef = useRef<number>(0);

    const handleCloseModal = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            videoRef.current.src = '';
        }
        setVideoState({
            ...videoState,
            isModalVisible: false,
        });
    };


    const handleLoadedMetadata = async () => {
        if (videoRef.current) {
            try {
                const {data} = await axios.get(`/video/${videoState.videoId}`);
                let {total_frame, fps} = data;
                videoFPSRef.current = fps;
                const video_duration = total_frame / fps
                videoRef.current.currentTime = Math.max(0, (parseInt(videoState.frameId) / total_frame) * video_duration - 3);
            } catch (error) {
                console.error('Error fetching timestamp:', error);
            }
        }
    };

    return <Modal
        title="Video"
        open={videoState.isModalVisible}
        onCancel={handleCloseModal}
        width={1280}
        height={800}
        footer={null}
    >
        <div>Đợi 1-2s video sẽ tự load đến frame</div>
        <Button
            type="primary"
            onClick={() => {
                let frameId: any = Math.round(videoRef.current?.currentTime ?? 0) * (videoFPSRef.current ?? 0);
                frameId = frameId.toString().padStart(6, '0');
                copyToClipboard(`${videoState.videoId}_${frameId}`);
                messageApi.open({
                    type: 'success',
                    content: 'Copied! - ' + `${videoState.videoId}_${frameId}`,
                });
            }}
            style={{marginBottom: '10px', marginRight: '10px'}}
        >
            Copy Video Frame ID
        </Button>
        {/*<Button*/}
        {/*    type="primary"*/}
        {/*    onClick={() => {*/}
        {/*        let frameId: any = Math.round(videoRef.current?.currentTime ?? 0) * (videoFPSRef.current ?? 0);*/}
        {/*        frameId = frameId.toString().padStart(6, '0');*/}
        {/*        copyToClipboard(`${videoState.videoId}_${frameId}`);*/}
        {/*        messageApi.open({*/}
        {/*            type: 'success',*/}
        {/*            content: 'Copied! - ' + `${videoState.videoId}_${frameId}`,*/}
        {/*        });*/}
        {/*    }}*/}
        {/*    style={{marginBottom: '10px'}}*/}
        {/*>*/}
        {/*    Submit*/}
        {/*</Button>*/}
        <video
            width="100%"
            controls
            autoPlay muted
            ref={videoRef}
            src={videoState.videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
        >
            <source src={videoState.videoUrl} type="video/mp4"/>
            Your browser does not support the video tag.
        </video>
    </Modal>
}


export default React.memo(VideoPlayer);
