import React, { useState, useEffect } from 'react';
import { Form, Input, Button, notification, Select, Card } from 'antd';
import axios from '@/utils/axios';

const { Option } = Select;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [evaluationData, setEvaluationData] = useState<any[]>([]);
    const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const savedEvaluationId = localStorage.getItem('selectedEvaluationId');
        const savedSessionId = localStorage.getItem('sessionId');
        if (savedEvaluationId) {
            setSelectedEvaluationId(savedEvaluationId);
        }
        if (savedSessionId) {
            setSessionId(savedSessionId);
        }
    }, []);

    const onFinish = async (values: { username: string; password: string }) => {
        setLoading(true);
        try {
            const response = await axios.post('/user/login', values);
            notification.success({
                message: 'Login Successful',
                description: 'You have successfully logged in.',
            });
            setEvaluationData(response.data.evaluation_data);
            setSessionId(response.data.login_data.sessionId);
            localStorage.setItem('sessionId', response.data.login_data.sessionId);
        } catch (error) {
            notification.error({
                message: 'Login Failed',
                description: 'Invalid username or password.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluationSelect = (value: string) => {
        setSelectedEvaluationId(value);
        localStorage.setItem('selectedEvaluationId', value);
    };

    return (
        <div style={{ maxWidth: 300, margin: '0 auto', padding: '50px 0' }}>
            <Form
                name="login"
                onFinish={onFinish}
                initialValues={{ username: 'team06', password: 'MS68L9h9Dx' }}
            >
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Please input your username!' }]}
                >
                    <Input placeholder="Username" />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please input your password!' }]}
                >
                    <Input.Password placeholder="Password" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Login
                    </Button>
                </Form.Item>
            </Form>

            {evaluationData.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <h3>Select an Evaluation Task</h3>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Select an evaluation task"
                        onChange={handleEvaluationSelect}
                        value={selectedEvaluationId}
                    >
                        {evaluationData.map((evaluation) => (
                            <Option key={evaluation.id} value={evaluation.id}>
                                {evaluation.name}
                            </Option>
                        ))}
                    </Select>
                </div>
            )}

            {selectedEvaluationId && sessionId && (
                <div style={{ marginTop: 20 }}>
                    <Card>
                        <p><strong>Session ID:</strong> {sessionId}</p>
                        <p><strong>Selected Evaluation ID:</strong> {selectedEvaluationId}</p>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default LoginPage;