import * as React from "react";

interface Props {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    userName: string;
}

export const NameEditComponent: React.FC<Props> = ({ onChange, userName }) => (
    <div>
        <label>Update name:</label>
        <input value={userName} onChange={onChange} />
    </div>
);
