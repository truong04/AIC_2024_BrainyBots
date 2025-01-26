import React, {useEffect, useState} from 'react';
import {Input} from 'antd';

interface QueryInputProps {
    selectedFile: File | null;
    setRefQuery: (query: string) => void;
}

const QueryInput: React.FC<QueryInputProps> = ({selectedFile, setRefQuery}) => {
    const [query, setQuery] = useState('');


    useEffect(() => {
        setRefQuery(query);
    }, [query]);

    return (
        <Input.TextArea
            disabled={selectedFile !== null}
            placeholder="Query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{flex: 1, marginBottom: 8}}
            autoSize={{minRows: 3, maxRows: 6}}
        />
    );
};

export default QueryInput;