import React, {useState} from 'react';
import {Select, List, Card, Pagination, Spin, Button, notification} from 'antd';
import axios from '@/utils/axios';
import {BASE_URL} from "@/constants";
import {delay} from "@/utils/time";

const {Option} = Select;

const options = Array.from({length: 30}, (_, i) => ({
    value: `L${String(i + 1).padStart(2, '0')}`,
    label: `L${String(i + 1).padStart(2, '0')}`
}));

const IgnorePage = () => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [images, setImages] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [pageSize, setPageSize] = useState<number>(10);

    const handleChange = (selected: string[]) => {
        setSelectedOptions(selected);
        fetchData(selected, 1, pageSize);
    };

    const handleSelectAll = () => {
        const allOptions = options.map(option => option.value);
        setSelectedOptions(allOptions);
        fetchData(allOptions, 1, pageSize);
    };

    const handleClearAll = () => {
        setSelectedOptions([]);
        setImages([]);
        setTotalItems(0);
    };

    const fetchData = async (selectedValues: string[], page: number, size: number) => {
        setLoading(true);
        try {
            const response = await axios.post(`ignore_frames/search?page_index=${page}&page_size=${size}`, selectedValues, {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            const imagePaths = response.data.hits.hits.map((item: any) => {
                const source = item._source;
                const id_parts = source.my_id.split('_');
                return {
                    id: source.my_id,
                    image_path: `${BASE_URL}/keyframes_webp/${id_parts[0]}_extra/${id_parts[1]}/${id_parts[2]}.webp`,
                    tags: source.tags
                };
            });
            setImages(imagePaths);
            setTotalItems(response.data.hits.total.value);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUndoRestore = async (video_id: string, frame_id: string, notificationKey: string) => {
        try {
            notification.destroy(notificationKey);
            await axios.post(`ignore_frames/`, [{video_id, frame_id}]);
            await delay(1000);
            fetchData(selectedOptions, currentPage, pageSize);
        } catch (error) {
            console.error('Error undoing restore:', error);
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const id_parts = id.split('_');
            const video_id = id_parts[0] + "_" + id_parts[1];
            const frame_id = id_parts[2];
            await axios.post(`ignore_frames/restore`, [{video_id, frame_id}]);
            const newImages = images.filter(item => item.id !== id);
            setImages(newImages);

            const notificationKey = `restore_${id}`;

            notification.open({
                message: 'Restore Successful',
                description: 'The frame has been restored. Click undo to revert.',
                btn: (
                    <Button type="primary" size="small" onClick={() => handleUndoRestore(video_id, frame_id, notificationKey)}>
                        Undo
                    </Button>
                ),
                key: notificationKey,
                duration: 5,
            });
        } catch (error) {
            console.error('Error restoring data:', error);
        }
    };

    const handlePageChange = (page: number, size?: number) => {
        setCurrentPage(page);
        fetchData(selectedOptions, page, size || pageSize);
    };

    const handlePageSizeChange = (current: number, size: number) => {
        setPageSize(size);
        fetchData(selectedOptions, current, size);
    };

    return (
        <div>
            <Button onClick={handleSelectAll} style={{marginBottom: 20, marginRight: 10}}>
                Select All
            </Button>
            <Button onClick={handleClearAll} style={{marginBottom: 20}}>
                Clear All
            </Button>
            <Select
                mode="multiple"
                style={{width: '100%', marginBottom: 20}}
                placeholder="Select options"
                onChange={handleChange}
                value={selectedOptions}
            >
                {options.map(option => (
                    <Option key={option.value} value={option.value}>
                        {option.label}
                    </Option>
                ))}
            </Select>
            {loading ? (
                <Spin style={{display: 'block', margin: '20px auto'}}/>
            ) : (
                <>
                    <div style={{marginBottom: 20, textAlign: 'center'}}>
                        Total Results: {totalItems}
                    </div>
                    <List
                        grid={{gutter: 16, column: 5}}
                        dataSource={images}
                        renderItem={item => (
                            <List.Item>
                                <Card
                                    key={item.id}
                                    cover={<img alt={item.tags} src={item.image_path}/>}
                                    actions={[
                                        <Button type="link"
                                                key={item.id + "_restore"}
                                                onClick={() => handleRestore(item.id)}>Restore</Button>
                                    ]}
                                >
                                    <Card.Meta title={item.id}/>
                                </Card>
                            </List.Item>
                        )}
                    />
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={totalItems}
                        onChange={handlePageChange}
                        onShowSizeChange={handlePageSizeChange}
                        style={{marginTop: 20, textAlign: 'center'}}
                    />
                </>
            )}
        </div>
    );
};

export default IgnorePage;