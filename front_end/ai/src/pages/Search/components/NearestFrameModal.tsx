import {ImageData} from "@/pages/Search/interface/ImageData";
import {Modal, Image, Button, Spin} from "antd";
import React, {useEffect, useState} from "react";
import axios from "@/utils/axios";
import ImagePreview from "@/pages/Search/components/ImagePreview";

interface NearestFrameModalProps {
    open: boolean;
    onClose: () => void;
    item: ImageData | undefined;
    messageApi?: any;
    copyToClipboard?: any;
    cauHoiSo?: any;
}

const NearestFrameModal = ({open, onClose, item, messageApi, copyToClipboard, cauHoiSo}: NearestFrameModalProps) => {
    const [frames, setFrames] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            const fetchNearestFrames = async () => {
                try {
                    const response = await axios.get(`/search_frames/nearest-ids/${item?.id}`);
                    setFrames(response.data);
                } catch (error) {
                    console.error("Error fetching nearest frames:", error);
                }
            };
            fetchNearestFrames();
        }
    }, [open, item]);

    const handleDecreaseFrameScore = async () => {
        if (!cauHoiSo) return;
        setLoading(true);
        try {
            const response = await axios.post('search_frames/remove_cau_hoi_so_by_id', {
                cau_hoi_so: cauHoiSo,
                id_list: frames.map(frame => frame.id)
            });
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
            onClose();
        }
    }


    return (
        <Modal
            title="Nearest Frame"
            open={open}
            onCancel={onClose}
            width="100vw"
            style={{top: 0}}
            bodyStyle={{height: '100vh', padding: 0}}
            okText="Confirm"
            cancelText="Cancel"
            footer={[
                cauHoiSo && <Button disabled={loading} key="Decrease_IN_nearest Frame" danger type="primary" onClick={handleDecreaseFrameScore}>
                    {loading ? <Spin/> : `Decrease All Frame Score from Query ID: ${cauHoiSo}`}
                </Button>
            ]}
        >
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '10px', height: 'calc(100vh - 50px)', overflowY: 'auto'
            }}>
                {frames.map((frame) => (
                    <ImagePreview key={frame.id + "_preview"} id={frame.id}
                                  messageApi={messageApi} copyToClipboard={copyToClipboard}
                                  image={frame}
                    ></ImagePreview>
                ))}
            </div>
        </Modal>
    );
}

export default NearestFrameModal;