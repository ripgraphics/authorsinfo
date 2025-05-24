'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Mail, Phone, Globe, MapPin } from "lucide-react";

interface Group {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  contact_info: {
    email: string;
    phone: string;
    website: string;
    address: string;
  };
}

export default function GroupDetail() {
  const params = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroup, setEditedGroup] = useState<Partial<Group>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/groups/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch group');
        }
        const data = await response.json();
        setGroup(data);
        setEditedGroup(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchGroup();
    }
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedGroup(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedGroup(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [name]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!group) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/groups/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedGroup),
      });

      if (!response.ok) {
        throw new Error('Failed to update group');
      }

      const updatedGroup = await response.json();
      setGroup(updatedGroup);
      setIsEditing(false);
      toast.success('Group updated successfully');
    } catch (err) {
      toast.error('Failed to update group');
      console.error('Error updating group:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error || 'Group not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="about" className="space-y-4">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={editedGroup.name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={editedGroup.description || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedGroup(group);
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{group.name}</h3>
                    <p className="text-gray-600 mt-2">{group.description}</p>
                  </div>
                  <Button onClick={() => setIsEditing(true)}>Edit Group</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={editedGroup.contact_info?.email || ''}
                      onChange={handleContactInfoChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={editedGroup.contact_info?.phone || ''}
                      onChange={handleContactInfoChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={editedGroup.contact_info?.website || ''}
                      onChange={handleContactInfoChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={editedGroup.contact_info?.address || ''}
                      onChange={handleContactInfoChange}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {group.contact_info?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span>{group.contact_info.email}</span>
                    </div>
                  )}
                  {group.contact_info?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span>{group.contact_info.phone}</span>
                    </div>
                  )}
                  {group.contact_info?.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <span>{group.contact_info.website}</span>
                    </div>
                  )}
                  {group.contact_info?.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <span>{group.contact_info.address}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Member management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Group Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Settings management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 