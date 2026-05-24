import { useEffect, useRef } from 'react';

const NewMessageInput = ({ value, onChange, onSend }) => {
    const input = useRef(null);

    const onInputKeyDown = (ev) => {
        if (ev.key !== 'Enter') {
            return;
        }

        if (ev.shiftKey) {
            return;
        }

        ev.preventDefault();
        onSend();
    };

    const adjustHeight = () => {
        setTimeout(() => {
            if (!input.current) {
                return;
            }

            input.current.style.height = 'auto';
            input.current.style.height = input.current.scrollHeight + 1 + 'px';
        }, 100);
    };

    const onChangeEvent = (ev) => {
        setTimeout(() => {
            adjustHeight();
        }, 10);
        onChange(ev);
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            ref={input}
            value={value}
            rows="1"
            placeholder="Type a message"
            onKeyDown={onInputKeyDown}
            onChange={onChangeEvent}
            className="textarea textarea-bordered max-h-40 w-full resize-none overflow-y-auto rounded-r-none"
        ></textarea>
    );
};

export default NewMessageInput;
