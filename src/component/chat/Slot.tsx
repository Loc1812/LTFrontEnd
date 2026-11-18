interface SlotProps {
    label: string;
    hint?: string;
    className?: string;
}

function Slot({label, hint, className = ""}: SlotProps) {
    return (
        <div className={`slot ${className}`}>
            <span>
                {label}
                {hint && <small>{hint}</small>}
            </span>
        </div>
    );
}

export default Slot;
