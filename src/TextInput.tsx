import cls from 'classnames';
import {
  InputHTMLAttributes,
  forwardRef,
  ImgHTMLAttributes,
  ReactElement,
  cloneElement,
  ChangeEvent,
} from 'react';

export enum TextInputSize {
  S,
  M,
  L,
  XL,
}

export type ITextInput = {
  /**
   * set a space for supporting text under the input
   */
  indication?: string;
  hasError?: boolean;
  inputType?: string;
  LeadingVisual?: ReactElement<ImgHTMLAttributes<HTMLImageElement | SVGElement>>;
  onTrailingVisualClick?: VoidFunction;
  onLeadingVisualClick?: VoidFunction;
  containerClassName?: string;
  trailingVisualClassName?: string;
  className?: string;
  size?: TextInputSize;
  disabled?: boolean;
  // onChange?: (event: string) => void;
  placeholder?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextInput(
  {
    onChange,
    placeholder,
    value,
    indication,
    size = TextInputSize.L,
    hasError,
    inputType = 'text',
    disabled,
    LeadingVisual,
    onTrailingVisualClick,
    onLeadingVisualClick,
    className,
    containerClassName,
    trailingVisualClassName,
    ...rest
  }: ITextInput) {
  const isSmall = size === TextInputSize.S || size === TextInputSize.M;

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
  };

  const agregatedClassName = cls(
    className,
    'w-full truncate focus:outline-none',
    'p-4',

    'py-1.5',
    // match(size)
    //   .with(TextInputSize.S, () => 'py-1.5')
    //   .with(TextInputSize.M, () => 'py-2.5')
    //   .with(TextInputSize.L, () => 'py-3')
    //   .with(TextInputSize.XL, () => 'py-4')
    //   .run(),
    isSmall ? 'text-base' : 'text-lg',
    // eslint-disable-next-line no-nested-ternary
    LeadingVisual ? (isSmall ? 'pl-10' : 'pl-11') : '',
    // eslint-disable-next-line no-nested-ternary
    'rounded-2xl bg-surface-variant-muted border transition-colors',
    'focus:outline-0 focus:outline-offset-0',
    hasError
      ? 'border-danger caret-danger'
      : 'border-surface-variant-muted focus:border focus:border-outline caret-accent',
    disabled
      ? 'placeholder:text-font-muted-disabled'
      : 'placeholder:text-font-variant hover:bg-surface-variant-muted-hover-font',
    LeadingVisual && 'relative',
  );

  return (
    <div className={cls('flex flex-col gap-1', containerClassName)}>
      <div className={cls('relative', disabled ? 'text-font-disabled' : 'text-font')}>
        <input
          disabled={disabled}
          type={inputType}
          value={value}
          className={agregatedClassName}
          onChange={handleChange}
          placeholder={placeholder}
          {...rest}
        />
        {LeadingVisual && (
          <button
            type="button"
            className={cls(
              'absolute h-full inset-y-0 flex items-center justify-center',
              'focus:outline-0 focus:outline-offset-0 !border-none !border-transparent p-0',
              { 'cursor-default': !onLeadingVisualClick },
              isSmall ? 'left-5' : 'left-6',
            )}
          >
            {cloneElement(LeadingVisual, {
              ...LeadingVisual.props,
              className: cls(
                isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4',
                'fill-current translate-x-[-50%]',
                LeadingVisual.props.className,
              ),
            })}
          </button>
        )}

        <div className="flex gap-3 items-center inset-y-0 absolute right-4">
          {indication && (
            <div
              className={cls(
                isSmall ? 'text-sm' : 'text-base',
                'flex items-center',
                // eslint-disable-next-line no-nested-ternary
                disabled ? 'text-font-muted-disabled' : hasError ? 'text-danger' : 'text-font-variant',
              )}
            >
              {indication}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TextInput.displayName = 'TextInput';
