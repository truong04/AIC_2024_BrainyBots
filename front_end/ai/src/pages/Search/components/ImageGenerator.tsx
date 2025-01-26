import React, {useState} from 'react';
import axios from '../../../utils/axios';
import {Input, Button, Spin, Row, Col, Image} from 'antd';
import {OpenAIFilled, SearchOutlined} from "@ant-design/icons";

// @ts-ignore
const ImageGenerator = ({ messageApi }) => {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateImage = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`image_generator/create`, {
                prompt: prompt,
            });
            setImageUrl(response.data.image);
            messageApi.open({
                type: 'success',
                content: 'Image generated successfully',
            });
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchByImage = async () => {
        setIsLoading(true);
        try {
            // Implement the search by image functionality here
            console.log('Search by image functionality not implemented yet.');
        } catch (error) {
            console.error('Error searching by image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Row gutter={8}>
                <Col>
                    <Input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter prompt to generate image"
                    />
                </Col>
                <Col>
                    <Button type="primary" onClick={handleGenerateImage} disabled={isLoading}>
                        {isLoading ? <Spin/> : <OpenAIFilled/>}
                    </Button>
                </Col>
                <Col>
                    <Button type="default" onClick={handleSearchByImage} disabled={isLoading}>
                        <SearchOutlined/>
                    </Button>
                </Col>
            </Row>
            <Row style={{marginTop: 8}}>
                <Col>
                    {imageUrl &&
                        <Image src={`data:image/png;base64,${imageUrl}`} alt="Generated" style={{height: '150px'}}/>}
                </Col>
            </Row>
        </div>
    );
};

export default React.memo(ImageGenerator);