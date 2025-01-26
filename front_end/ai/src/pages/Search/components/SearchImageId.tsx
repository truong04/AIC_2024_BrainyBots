import {Input} from "antd";
import {useEffect, useState} from "react";

const SearchImageId: React.FC<{ setImageIdRef: (value: string) => void }> = ({ setImageIdRef }) => {
    const [imageId, setImageId] = useState("");

    useEffect(() => {
        setImageIdRef(imageId);
    }, [imageId]);

    return (
        <Input
            placeholder="Image ID"
            value={imageId}
            onChange={(e) => setImageId(e.target.value.replace(',', '_'))}
            style={{ flex: 1, marginRight: 8 }}
        />
    );
};

export default SearchImageId;