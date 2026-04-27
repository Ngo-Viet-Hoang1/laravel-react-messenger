import { useEffect, useRef } from "react"

const NewMessageInput = ({ value, onChange, onSend }) => {
    const input = useRef(null);

    const onInputKeyDown = (ev) => {
        if (ev.key === "Enter" && !ev.shiftKey) { 
            ev.preventDefault();
            onSend();
        }
    }

    const onChangeEvent = (ev) => { 
        setTimeout(() => { 
            adjustHeight();
        }, 10);
        onChange(ev);
    }

    const adjustHeight = () => { 
        setTimeout(() => { 
            if (!input.current) {
                return;
            }

            input.current.style.height = "auto";
            input.current.style.height = input.current.scrollHeight + 1 + "px";
        }, 100);
    }

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
            onChange={(ev) => onChangeEvent(ev)}
            className="input input-bordered w-full rounded-r-none resize-none overflow-y-auto max-h-40"
        />
    );
}

export default NewMessageInput;