import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Hash, Loader2 } from 'lucide-react';
import {
  createChannelSchema,
  type CreateChannelFormValues,
} from '../model/createChannelSchema';
import { useCreateChannelMutation, type ChannelDetail } from '@/entities/channel';


export interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channel: ChannelDetail) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  open,
  onOpenChange,
  onChannelCreated,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: '',
      description: '',
      avatarUrl: '',
    },
  });

  const createMutation = useCreateChannelMutation({
    onSuccess: (channel) => {
      reset();
      onOpenChange(false);
      onChannelCreated?.(channel);
    },
  });

  const onSubmit = (values: CreateChannelFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">Create a Channel</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Channels are where your team communicates. They are best organized around a topic.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Channel Name */}
          <div className="space-y-1.5">
            <Label htmlFor="channel-name" className="text-xs font-semibold">
              Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60 text-xs font-mono">
                #
              </span>
              <Input
                id="channel-name"
                placeholder="e.g. Project Phoenix, General, Team Frontend"
                className="pl-7 text-xs"
                disabled={createMutation.isPending}
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="channel-desc" className="text-xs font-semibold">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="channel-desc"
              placeholder="What is this channel about?"
              rows={3}
              className="text-xs resize-none"
              disabled={createMutation.isPending}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Create Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
