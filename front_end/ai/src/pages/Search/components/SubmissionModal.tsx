import {Button, Form, Input, Modal, notification, Select} from "antd";
import {ImageData} from "@/pages/Search/interface/ImageData";
import {useEffect, useState} from "react";
import axios from '@/utils/axios';

interface SubmissionModalProps {
    open: boolean;
    onClose: () => void;
    item_list: ImageData[];
}

async function getVideoDetails(videoId: string) {
    try {
        const response = await axios.get(`video/${videoId}`, {
            headers: {
                'accept': 'application/json'
            }
        });
        const {total_frame, fps} = response.data;
        return {total_frame, fps};
    } catch (error) {
        console.error('Error fetching video details:', error);
        throw error;
    }
}

async function convertKeyFrameToTimestamp(data: any) {
    const {video_id, frame_id} = data[0];
    const {total_frame, fps} = await getVideoDetails(video_id);
    const video_duration = total_frame / fps;
    const timestamp = (parseInt(frame_id) / total_frame) * video_duration * 1000;
    return Math.round(timestamp);
}

async function submitKIS(session_id: string | null, evaluation_id: string | null,
                         video_id: string | undefined,
                         timestamp: number) {
    try {
        const {data} = await axios.post(`https://eventretrieval.one/api/v2/submit/${evaluation_id}?session=${session_id}`, {
            "answerSets": [
                {
                    "answers": [
                        {
                            "mediaItemName": video_id,
                            "start": timestamp - 1,
                            "end": timestamp + 1
                        }
                    ]
                }
            ]
        });
        return data;
    } catch (e: any) {
        return {
            status: false,
            description: e.response?.data?.description || 'Error submitting KIS'
        };
    }
}

async function submitQA(session_id: string | null, evaluation_id: string | null,
                        video_id: string | undefined,
                        answer: string | undefined, timestamp: number) {
    try {
        const {data} = await axios.post(`https://eventretrieval.one/api/v2/submit/${evaluation_id}?session=${session_id}`, {
            "answerSets": [
                {
                    "answers": [
                        {
                            "text": `${answer}-${video_id}-${timestamp}`
                        }
                    ]
                }
            ]
        });
        return data;
    } catch (e: any) {
        return {
            status: false,
            description: e.response?.data?.description || 'Error submitting QA'
        };
    }
}

// Modify the onSubmit function in SubmissionModal
const SubmissionModal: React.FC<SubmissionModalProps> = ({open, onClose, item_list}) => {
    const [form] = Form.useForm();
    const [selectType, setSelectType] = useState<string | undefined>(undefined);
    const session_id = localStorage.getItem('sessionId');
    const evaluation_id = localStorage.getItem('selectedEvaluationId');
    const [timestamp, setTimestamp] = useState<number>(0);

    useEffect(() => {
        const fetchTimestamp = async () => {
            try {
                const timestamp = await convertKeyFrameToTimestamp(item_list);
                setTimestamp(timestamp);
            } catch (error) {
                console.error('Error fetching timestamp:', error);
            }
        };
        fetchTimestamp();
    }, [item_list]);

    const handleSubmit = async (values: any) => {
        let response = null;
        if (selectType === 'kis') {
            response = await submitKIS(session_id, evaluation_id, item_list[0].video_id, timestamp);
        } else if (selectType === 'qa') {
            response = await submitQA(session_id, evaluation_id, item_list[0].video_id,
                values.answer.trim(), timestamp);
        }
        if (response.status && response?.submission === 'CORRECT') {
            notification.success({
                message: 'Submission Successful',
                description: response.description,
            });
        } else {
            notification.error({
                message: 'Submission Failed',
                description: response.description,
            });
        }
        onClose();
    };

    return (
        <Modal open={open} onCancel={onClose} title="Submit Items" footer={[
            <Button key="cancel" onClick={onClose}>Cancel</Button>,
            <Button key="submit" type="primary" onClick={() => {
                form.submit();
            }}>Submit</Button>
        ]}>
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
                <Form.Item label="Select Type" name="selectType">
                    <Select onChange={(value) => setSelectType(value)}>
                        <Select.Option value="kis">TextualKIS</Select.Option>
                        <Select.Option value="qa">Q&A</Select.Option>
                    </Select>
                </Form.Item>
                {selectType === 'qa' && (
                    <Form.Item label="Answer" name="answer">
                        <Input.TextArea rows={4}/>
                    </Form.Item>
                )}
                {item_list.map(item => (
                    <div key={item.id} style={{marginBottom: '10px', display: 'flex', alignItems: 'center'}}>
                        <img src={item.image_path} alt={item.id}
                             style={{width: '100px', height: 'auto', marginRight: '10px'}}/>

                        <span>
                            <div>
                              Id: <b>{item.id}</b>
                            </div>
                            <div>
                              Timestamp: <b>{timestamp}</b>
                            </div>
                        </span>
                    </div>
                ))}
            </Form>
        </Modal>
    );
}

export default SubmissionModal;