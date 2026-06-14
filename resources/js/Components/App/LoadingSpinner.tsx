type Props = {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
};

const LoadingSpinner = ({ size = 'sm', className = '' }: Props) => (
    <span
        className={`loading loading-spinner loading-${size} ${className}`.trim()}
    />
);

export default LoadingSpinner;
