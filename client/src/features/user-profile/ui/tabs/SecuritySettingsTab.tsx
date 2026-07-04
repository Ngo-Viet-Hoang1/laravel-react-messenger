import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { PasswordInput } from '@/shared/ui/password-input';
import { useChangePasswordMutation } from '@/entities/user';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '../../model/changePasswordSchema';
import { Loader2 } from 'lucide-react';

export interface SecuritySettingsTabProps {
  onSuccess?: () => void;
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ onSuccess }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useChangePasswordMutation({
    onSuccess: () => {
      reset();
      onSuccess?.();
    },
  });

  const onSubmit = (values: ChangePasswordFormValues) => {
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
      {/* Current Password */}
      <div className="space-y-1.5">
        <Label htmlFor="sec-current-pwd" className="text-xs font-semibold">
          Current Password <span className="text-destructive">*</span>
        </Label>
        <PasswordInput
          id="sec-current-pwd"
          {...register('currentPassword')}
          placeholder="Enter current password"
          className="text-xs"
          disabled={changePasswordMutation.isPending}
        />
        {errors.currentPassword && (
          <p className="text-[11px] text-destructive font-medium">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="sec-new-pwd" className="text-xs font-semibold">
          New Password <span className="text-destructive">*</span>
        </Label>
        <PasswordInput
          id="sec-new-pwd"
          {...register('newPassword')}
          placeholder="At least 6 characters"
          className="text-xs"
          disabled={changePasswordMutation.isPending}
        />
        {errors.newPassword && (
          <p className="text-[11px] text-destructive font-medium">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      {/* Confirm New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="sec-confirm-pwd" className="text-xs font-semibold">
          Confirm New Password <span className="text-destructive">*</span>
        </Label>
        <PasswordInput
          id="sec-confirm-pwd"
          {...register('confirmPassword')}
          placeholder="Re-type new password"
          className="text-xs"
          disabled={changePasswordMutation.isPending}
        />
        {errors.confirmPassword && (
          <p className="text-[11px] text-destructive font-medium">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={changePasswordMutation.isPending}
          className="h-8 text-xs font-medium"
        >
          {changePasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </Button>
      </div>
    </form>
  );
};
