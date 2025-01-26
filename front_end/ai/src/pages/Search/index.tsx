import React, {useState, useRef} from 'react';
import {PageContainer} from '@ant-design/pro-layout';
import {Input, List, Card, Button, Spin, Checkbox, Modal, Row, message, Col, Select} from 'antd';
import axios from '@/utils/axios';
import {BASE_URL} from "@/constants";
import {CopyOutlined, SearchOutlined, SendOutlined, VideoCameraFilled, OrderedListOutlined} from "@ant-design/icons";
import {ImageData} from "@/pages/Search/interface/ImageData";
import SubmissionModal from "@/pages/Search/components/SubmissionModal";
import NearestFrameModal from "@/pages/Search/components/NearestFrameModal";
import ImageGenerator from "@/pages/Search/components/ImageGenerator";
import {VideoState} from "@/pages/Search/interface/VideoState";
import {copyToClipboard} from "@/utils/clipboard";
import VideoPlayer from "@/pages/Search/components/VideoPlayer";
import ListComponent from "@/pages/Search/components/ListComponent";
import QueryInput from "@/pages/Search/components/QueryInput";
import OcrInput from "@/pages/Search/components/OcrInput";
import SearchImageId from "@/pages/Search/components/SearchImageId";
import NumberCandidatesSlider from "@/pages/Search/components/NumberCandidatesSlider";


const SearchPage: React.FC = () => {
    const queryRef = useRef('');
    const ocrRef = useRef('');
    const [asr, setAsr] = useState('');
    const [featureModel, setFeatureModel] = useState('dfn5b_clip');
    const imageIdRef = useRef('');
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loadingSimilar, setLoadingSimilar] = useState<{ [key: string]: boolean }>({});
    const [videoState, setVideoState] = useState<VideoState>({
        videoId: '',
        frameId: '',
        videoUrl: '',
        isModalVisible: false,
    });
    const [messageApi, contextHolder] = message.useMessage();
    const [isSubmissionModalVisible, setIsSubmissionModalVisible] = useState(false);
    const [clustering, setClustering] = useState(false);
    const resultSizeRef = useRef(1000);
    const [isNearestFrameModalVisible, setIsNearestFrameModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [cauHoiSo, setCauHoiSo] = useState(null);


    const searchByImageFile = async () => {
        if (!selectedFile) return;
        setLoading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("result_size", resultSizeRef.current.toString());
        formData.append("ocr", ocrRef.current ?? "");
        formData.append("asr", asr ?? "");
        formData.append("feature_model", featureModel);
        formData.append("is_enable_cluster", clustering ? "True" : "False");
        if (cauHoiSo) {
            formData.append("cau_hoi_so", cauHoiSo);
        }

        try {
            const response = await axios.post("search_frames/by-image-file", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const imagePaths = response.data.map((item: any) => ({
                id: item.id,
                image_path: `${BASE_URL}/keyframes_webp/${item.image_path}`,
                video_id: item.video_id,
                frame_id: item.frame_id,
                score: item.score,
            }));
            setImages(imagePaths);
        } catch (error) {
            console.error("Error uploading file:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDecreaseFrameScore = async () => {
        if (!cauHoiSo) return;
        setLoading(true);
        try {
            const response = await axios.post('search_frames/remove_cau_hoi_so_by_id', {
                cau_hoi_so: cauHoiSo,
                id_list: Array.from(selectedIds)
            });
            // remove selected ids from images
            setImages(prevImages => prevImages.filter(image => !selectedIds.has(image.id)));
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    }

    async function searchByQuery() {
        setLoading(true);
        try {
            const response = await axios.post('search_frames/', {
                query: queryRef.current,
                ocr: ocrRef.current,
                asr,
                feature_model: featureModel,
                is_enable_cluster: clustering,
                result_size: resultSizeRef.current,
                cau_hoi_so: cauHoiSo
            });

            const imagePaths = response.data.map((item: any) => ({
                id: item.id,
                image_path: `${BASE_URL}/keyframes_webp/${item.image_path}`,
                video_id: item.video_id,
                frame_id: item.frame_id,
                score: item.score,
            }));
            setImages(imagePaths);
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = async () => {
        if (selectedFile) {
            searchByImageFile();
            return;
        }
        await searchByQuery();
    };


    const handleSearchById = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`search_frames/by_id`, {
                image_id: imageIdRef.current,
                feature_model: featureModel,
            });
            const imagePaths = response.data.map((item: any) => ({
                id: item.id,
                image_path: `${BASE_URL}/keyframes_webp/${item.image_path}`,
                video_id: item.video_id,
                frame_id: item.frame_id,
                score: item.score,
            }));
            setImages(imagePaths);
        } catch (error) {
            console.error('Error fetching search results by ID:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSimilar = async (id: string) => {
        setLoadingSimilar(prev => ({...prev, [id]: true}));
        try {
            const response = await axios.post(`search_frames/by_id`, {
                image_id: id,
                feature_model: featureModel,
            });
            const imagePaths = response.data.map((item: any) => ({
                id: item.id,
                image_path: `${BASE_URL}/keyframes_webp/${item.image_path}`,
                video_id: item.video_id,
                frame_id: item.frame_id,
                score: item.score,
            }));
            setImages(imagePaths);
        } catch (error) {
            console.error('Error fetching similar images:', error);
        } finally {
            setLoadingSimilar(prev => ({...prev, [id]: false}));
        }
    };

    const handleCheckboxChange = (id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    const handleAddToIgnore = async () => {
        const selectedFrames = images.filter(image => selectedIds.has(image.id)).map(image => ({
            video_id: image.video_id,
            frame_id: image.frame_id
        }));

        try {
            await axios.post('/ignore_frames/', selectedFrames);
            console.log('Add to Ignore:', selectedFrames);
            setImages(prevImages => prevImages.filter(image => !selectedIds.has(image.id)));
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Error adding to ignore:', error);
        }
    };

    const handleSelectAll = () => {
        const allIds = new Set(images.map(image => image.id));
        setSelectedIds(allIds);
    };

    const handleClearAll = () => {
        setSelectedIds(new Set());
    };

    const handleOpenVideo = (videoId: string, frameId: string) => {
        setVideoState({
            videoId,
            frameId,
            videoUrl: `${BASE_URL}/api/v1/video/stream/${videoId}?timestamp=${new Date().getTime()}`,
            isModalVisible: true,
        });
    };

    return (
        <PageContainer
            header={{
                title: '',
            }}
        >
            {contextHolder}
            <div style={{marginBottom: 16, display: 'flex', gap: '8px'}}>
                <Col>
                    <QueryInput
                        selectedFile={selectedFile}
                        setRefQuery={(value) => {
                            queryRef.current = value;
                        }}
                    />
                    <Row style={{marginBottom: 8}}>
                        <input
                            type="file"
                            style={{display: 'none'}}
                            accept="image/*"
                            id="file-upload"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && file.type.startsWith('image/')) {
                                    // @ts-ignore
                                    setSelectedFile(file);
                                } else {
                                    console.error('Please select an image file.');
                                }
                            }}
                        />
                        <Col style={{marginRight: 8}}>
                            {selectedFile === null && <Button type="primary" disabled={loading}
                                                              onClick={() => document.getElementById('file-upload')?.click()}>
                                {loading ? <Spin/> : 'Select file to search'}
                            </Button>}
                            {selectedFile !== null && <Button danger type='primary' onClick={() => {
                                setSelectedFile(null);
                                (document.getElementById('file-upload') as HTMLInputElement).value = '';
                            }}> Remove search by image file </Button>}
                        </Col>
                        <Col>
                            <Select
                                showSearch
                                placeholder="Select Model"
                                value={featureModel}
                                defaultValue={featureModel}
                                onChange={(value) => setFeatureModel(value)}
                                style={{width: 325}}
                                filterOption={(input, option) =>
                                    option?.value?.toString()?.toLowerCase()?.includes(input.toLowerCase()) ?? false
                                }
                            >
                                {['clip', 'sig_clip', 'dfn5b_clip', 'blip2'].map((item, index) => (
                                    <Select.Option key={index} value={item}>
                                        {item}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Col>
                    </Row>
                    <Row>
                        <OcrInput
                            setRefOcr={(value) => ocrRef.current = value}
                        />
                        <Input
                            placeholder="ASR"
                            value={asr}
                            onChange={(e) => setAsr(e.target.value)}
                            style={{flex: 1, marginRight: 8}}
                        />
                        <NumberCandidatesSlider setResultSizeRef={(value) => resultSizeRef.current = value}/>
                    </Row>
                    <Row style={{marginTop: 8}}>
                        <Checkbox
                            onChange={(e) => setClustering(e.target.checked)}
                            style={{alignSelf: 'center'}}
                        >
                            Enable Clustering
                        </Checkbox>
                        <Button type="primary" onClick={handleSearch} disabled={loading}>
                            {loading ? <Spin/> : 'Search'}
                        </Button>
                    </Row>

                </Col>
                <Col>
                    <ImageGenerator messageApi={messageApi}></ImageGenerator>
                </Col>
                <Col>
                    <Row>
                        <SearchImageId
                            setImageIdRef={(value) => {
                                imageIdRef.current = value;
                            }}
                        />
                        <Button type="primary" onClick={handleSearchById} disabled={loading}>
                            {loading ? <Spin/> : 'Search by ID'}
                        </Button>
                    </Row>
                </Col>
            </div>
            <div style={{marginBottom: 16, display: 'flex', gap: '8px'}}>
                <Button type="default" onClick={handleSelectAll}>
                    Select All
                </Button>
                {selectedIds.size > 0 && (
                    <>
                        <Button type="primary" onClick={handleAddToIgnore}>
                            Add to Ignore
                        </Button>
                        {cauHoiSo && <Button danger type="primary" onClick={handleDecreaseFrameScore}>
                            Decrease Frame Score from Query ID: {cauHoiSo}
                        </Button>}
                        <Button type="primary"
                                style={{backgroundColor: 'green', borderColor: 'green'}}
                                onClick={() => {
                                    setIsSubmissionModalVisible(true);
                                }}>
                            Submit
                        </Button>
                        <Button type="default" onClick={handleClearAll}>
                            Clear All
                        </Button>
                        <div style={{marginLeft: '8px', alignSelf: 'center'}}>
                            <b> Selected: {selectedIds.size}</b>
                        </div>
                    </>
                )}
            </div>
            <ListComponent
                images={images}
                selectedIds={selectedIds}
                loadingSimilar={loadingSimilar}
                handleCheckboxChange={handleCheckboxChange}
                handleSearchSimilar={handleSearchSimilar}
                handleOpenVideo={handleOpenVideo}
                copyToClipboard={copyToClipboard}
                messageApi={messageApi}
                setSelectedIds={setSelectedIds}
                setIsNearestFrameModalVisible={setIsNearestFrameModalVisible}
                setIsSubmissionModalVisible={setIsSubmissionModalVisible}
            />
            {isSubmissionModalVisible && <SubmissionModal open={isSubmissionModalVisible}
                                                          onClose={() => {
                                                              setIsSubmissionModalVisible(false);
                                                              setSelectedIds(new Set());
                                                          }}
                                                          item_list={images.filter(image => selectedIds.has(image.id))}
            ></SubmissionModal>}
            <NearestFrameModal open={isNearestFrameModalVisible}
                               item={images.find(image => selectedIds.has(image.id))}
                               cauHoiSo={cauHoiSo}
                               messageApi={messageApi} copyToClipboard={copyToClipboard}
                               onClose={() => {
                                   setIsNearestFrameModalVisible(false);
                                   setSelectedIds(new Set());
                               }}
            ></NearestFrameModal>
            <VideoPlayer videoState={videoState} setVideoState={(state) => {
                setVideoState(state);
            }} messageApi={messageApi}></VideoPlayer>
        </PageContainer>
    );
};

export default SearchPage;