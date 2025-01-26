import React from 'react';
import { List, Card, Checkbox, Button, Spin } from 'antd';
import { SearchOutlined, VideoCameraFilled, CopyOutlined, OrderedListOutlined, SendOutlined } from '@ant-design/icons';
import { ImageData } from '@/pages/Search/interface/ImageData';

interface ListComponentProps {
    images: ImageData[];
    selectedIds: Set<string>;
    loadingSimilar: { [key: string]: boolean };
    handleCheckboxChange: (id: string, checked: boolean) => void;
    handleSearchSimilar: (id: string) => void;
    handleOpenVideo: (videoId: string, frameId: string) => void;
    copyToClipboard: (text: string) => void;
    messageApi: any;
    setSelectedIds: (ids: Set<string>) => void;
    setIsNearestFrameModalVisible: (visible: boolean) => void;
    setIsSubmissionModalVisible: (visible: boolean) => void;
}

const ListComponent: React.FC<ListComponentProps> = ({
    images,
    selectedIds,
    loadingSimilar,
    handleCheckboxChange,
    handleSearchSimilar,
    handleOpenVideo,
    copyToClipboard,
    messageApi,
    setSelectedIds,
    setIsNearestFrameModalVisible,
    setIsSubmissionModalVisible
}) => {

    return (
        <List
            grid={{ gutter: 10, column: 5 }}
            dataSource={images}
            renderItem={(item, index) => (
                <List.Item>
                    <Card
                        bodyStyle={{ padding: 0 }}
                        id={item.id}
                        style={{
                            backgroundColor: selectedIds.has(item.id) ? 'red' : 'white',
                        }}
                        cover={
                            <div style={{ position: 'relative' }}>
                                <img style={{ width: '100%', height: 'auto', objectFit: 'cover' }} alt="example"
                                    src={item.image_path} />
                                <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                                    <Checkbox
                                        checked={selectedIds.has(item.id)}
                                        onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                                        style={{
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            color: 'white',
                                            padding: '2px 5px'
                                        }}
                                    >

                                    </Checkbox>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    color: 'white',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    padding: '2px 5px',
                                    fontSize: '10px'
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    color: 'white',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    padding: '2px 5px',
                                    fontSize: '10px'
                                }}>
                                    {item.video_id}
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '2px 5px',
                                    fontSize: '10px'
                                }}>
                                    {item.frame_id}
                                </div>
                            </div>
                        }
                    >
                        <Button
                            size={'small'}
                            type="default"
                            onClick={() => handleSearchSimilar(item.id)}
                            disabled={loadingSimilar[item.id]}
                        >
                            {loadingSimilar[item.id] ? <Spin /> : <SearchOutlined />}
                        </Button>
                        <Button
                            size={'small'}
                            type="primary"
                            key={item.id + '_video'}
                            onClick={() => handleOpenVideo(item.video_id, item.frame_id)}
                        >
                            <VideoCameraFilled></VideoCameraFilled>
                        </Button>
                        <Button
                            size={'small'}
                            type="default"
                            key={item.id + '_copy'}
                            onClick={() => {
                                copyToClipboard(item.id);
                                messageApi.open({
                                    type: 'success',
                                    content: 'Copied! - ' + item.id,
                                });
                            }}
                            style={{ backgroundColor: '#F7446D', color: 'white' }}
                        >
                            <CopyOutlined />
                        </Button>
                        <Button
                            size={'small'}
                            type="default"
                            key={item.id + '_nearest_ids'}
                            onClick={() => {
                                setSelectedIds(new Set([item.id]));
                                setIsNearestFrameModalVisible(true);
                            }}
                            style={{ backgroundColor: 'orange', color: 'white' }}
                        >
                            <OrderedListOutlined />
                        </Button>
                        <Button
                            size={'small'}
                            type="default"
                            key={item.id + '_send'}
                            onClick={() => {
                                setSelectedIds(new Set([item.id]));
                                setIsSubmissionModalVisible(true);
                            }}
                            style={{ backgroundColor: 'green', color: 'white' }}
                        >
                            <SendOutlined />
                        </Button>
                    </Card>
                </List.Item>
            )}
        />
    );
};

export default React.memo(ListComponent, (prevProps, nextProps) => {
    return (
        prevProps.images === nextProps.images &&
        prevProps.selectedIds === nextProps.selectedIds &&
        prevProps.loadingSimilar === nextProps.loadingSimilar &&
        prevProps.handleCheckboxChange === nextProps.handleCheckboxChange &&
        prevProps.handleSearchSimilar === nextProps.handleSearchSimilar &&
        prevProps.handleOpenVideo === nextProps.handleOpenVideo &&
        prevProps.copyToClipboard === nextProps.copyToClipboard &&
        prevProps.messageApi === nextProps.messageApi &&
        prevProps.setSelectedIds === nextProps.setSelectedIds &&
        prevProps.setIsNearestFrameModalVisible === nextProps.setIsNearestFrameModalVisible &&
        prevProps.setIsSubmissionModalVisible === nextProps.setIsSubmissionModalVisible
    );
});