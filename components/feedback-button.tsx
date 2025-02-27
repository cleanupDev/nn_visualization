// components/FeedbackButtonComponent.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Feedback button component
export function FeedbackButtonComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/send-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, feedback }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setStatus('success');
      // Reset form fields
      setName('');
      setEmail('');
      setFeedback('');
      // Close the dialog after a short delay to show success message
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-6 h-6 p-0 rounded-full"
          style={{
            backgroundColor: 'transparent', // Set background color to transparent
            borderColor: 'transparent', // Optional, match border with the background
          }}
        >
          <Image
            src="/feedback.svg" // Use your custom SVG here
            alt="Feedback"
            width={24}
            height={24}
            className="opacity-50 hover:opacity-100 transition-opacity"
          />
          <span className="sr-only">Open feedback form</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border border-zinc-800 bg-black/90 text-zinc-300 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-200">Feedback</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Send us your feedback to help improve the application.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-zinc-400">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-700 focus:ring-zinc-700"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-zinc-400">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3 bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-700 focus:ring-zinc-700"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedback" className="text-right text-zinc-400">
                Feedback
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="col-span-3 min-h-[100px] bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-700 focus:ring-zinc-700"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={status === 'loading'}
              className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              {status === 'loading' ? 'Sending...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
          {status === 'success' && (
            <p className="mt-2 text-green-500">Feedback sent successfully!</p>
          )}
          {status === 'error' && (
            <p className="mt-2 text-red-500">Error: {errorMessage}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
