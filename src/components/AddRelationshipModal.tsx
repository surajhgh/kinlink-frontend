'use client';

import { useState } from 'react';
import { relationshipsApi } from '@/lib/api';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { userId: string; fullName: string };
  familyMembers: User[];
}

export function AddRelationshipModal({
  isOpen,
  onClose,
  currentUser,
  familyMembers,
}: AddRelationshipModalProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedRelationshipType) {
      toast.error('Please select a user and relationship type');
      return;
    }
    setIsSubmitting(true);
    try {
      await relationshipsApi.createRelationship({
        toUserId: selectedUser,
        relationshipType: selectedRelationshipType,
        message: message || undefined,
      });
      toast.success('Relationship request sent!');
      onClose();
      setSelectedUser('');
      setSelectedRelationshipType('');
      setMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Relationship</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Select Family Member
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select someone...</option>
              {familyMembers
                .filter(member => member.userId !== currentUser.userId)
                .map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName} ({member.email})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Relationship Type
            </label>
            <select
              value={selectedRelationshipType}
              onChange={(e) => setSelectedRelationshipType(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select relationship type...</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Son">Son</option>
              <option value="Daughter">Daughter</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Only parent-child relationships can be requested
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
