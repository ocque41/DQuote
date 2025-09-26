import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { Controller, type ControllerProps, type FieldPath, type FieldValues, FormProvider, useFormContext } from 'react-hook-form';

import { cn } from '@/lib/utils';

const Form = FormProvider;

const FormField = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  { ...props }: ControllerProps<TFieldValues, TName>
) => {
  return <Controller {...props} />;
};

const FormItemContext = React.createContext<{ id: string } | undefined>(undefined);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = 'FormItem';

const useFormItem = () => {
  const context = React.useContext(FormItemContext);

  if (!context) {
    throw new Error('useFormItem must be used within a <FormItem>');
  }

  return context;
};

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { id } = useFormItem();
  return <LabelPrimitive.Root ref={ref} className={cn('text-sm font-medium', className)} htmlFor={id} {...props} />;
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { id } = useFormItem();
    return <Slot ref={ref} id={id} {...props} />;
  }
);
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn('text-sm font-medium text-destructive', className)} {...props}>
        {children}
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

const useFormField = () => {
  const fieldContext = useFormContext();
  const itemContext = React.useContext(FormItemContext);

  if (!itemContext) {
    throw new Error('useFormField should be used within <FormItem>');
  }

  return {
    id: itemContext.id,
    formState: fieldContext.formState
  };
};

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField };
