'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardNavbar from '@/components/ui/DashboardNavbar';

interface Profile {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
  gender?: string;
  role?: string;
  isVerified?: boolean;
  preferences?: any;
  createdAt: string;
  updatedAt: string;
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  label: string;
  notes: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    avatar: '',
    gender: '',
  });
  
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    label: '',
    notes: '',
    isDefault: false
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfileData();
    }
  }, [status]);

  const fetchProfileData = async () => {
    try {
      const profileRes = await fetch('/api/customer-profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
        
        // Set form data with current profile values
        if (profileData.profile) {
          setFormData({
            firstName: profileData.profile.firstName || '',
            lastName: profileData.profile.lastName || '',
            phone: profileData.profile.phone || '',
            dateOfBirth: profileData.profile.dateOfBirth || '',
            avatar: profileData.profile.avatar || '',
            gender: profileData.profile.gender || '',
          });
        }
      }
      
      const addressesRes = await fetch('/api/customer-profile/addresses');
      if (addressesRes.ok) {
        const addressesData = await addressesRes.json();
        setAddresses(addressesData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [fileError, setFileError] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setFileError('File size exceeds 5MB limit');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFileError('Please select an image file');
        return;
      }

      setFileError(null);
      setFormData({ ...formData, avatar: file as unknown as string });
    }
  };

  const validateProfileForm = () => {
    const errors: string[] = [];

    // Validate first name
    if (formData.firstName && formData.firstName.length > 50) {
      errors.push('First name must be 50 characters or less');
    } else if (formData.firstName && !/^[A-Za-z\s\-']+$/.test(formData.firstName.trim())) {
      errors.push('First name contains invalid characters');
    }

    // Validate last name
    if (formData.lastName && formData.lastName.length > 50) {
      errors.push('Last name must be 50 characters or less');
    } else if (formData.lastName && !/^[A-Za-z\s\-']+$/.test(formData.lastName.trim())) {
      errors.push('Last name contains invalid characters');
    }

    // Validate phone
    if (formData.phone && formData.phone.length > 20) {
      errors.push('Phone number must be 20 characters or less');
    } else if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      errors.push('Phone number contains invalid characters');
    }

    // Validate date of birth
    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date of birth');
      } else if (date > new Date()) {
        errors.push('Date of birth cannot be in the future');
      }
    }

    // Validate gender (if present, must be one of allowed values)
    if (formData.gender) {
      const validGenders = ['male', 'female'];
      if (!validGenders.includes(formData.gender)) {
        errors.push('Please select a valid gender option');
      }
    }

    return errors;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    const validationErrors = validateProfileForm();
    if (validationErrors.length > 0) {
      alert(`Validation errors: ${validationErrors.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      // Create FormData to handle file upload
      const profileData = new FormData();

      // Append non-file fields
      profileData.append('firstName', formData.firstName);
      profileData.append('lastName', formData.lastName);
      profileData.append('phone', formData.phone || '');
      profileData.append('dateOfBirth', formData.dateOfBirth);
      profileData.append('gender', formData.gender || '');

      // Append avatar file if it's a File object
      if (typeof formData.avatar !== 'string') {
        // If it's not a string, it must be a File
        profileData.append('avatar', formData.avatar as File);
      }
      // If it's a string (meaning no new file selected), we don't include it
      // and the API will maintain the existing avatar

      const response = await fetch('/api/customer-profile', {
        method: 'PUT',
        body: profileData,
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
      } else {
        const errorText = await response.text();
        console.error('Failed to update profile:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/customer-profile/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressForm),
      });
      
      if (response.ok) {
        const newAddress = await response.json();
        setAddresses([...addresses, newAddress]);
        // Reset form
        setAddressForm({
          firstName: '',
          lastName: '',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          isDefault: false
        });
      } else {
        console.error('Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressUpdate = async (id: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/customer-profile/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...addressForm }),
      });
      
      if (response.ok) {
        const updatedAddress = await response.json();
        setAddresses(addresses.map(addr => addr.id === id ? updatedAddress : addr));
        // Reset form
        setAddressForm({
          firstName: '',
          lastName: '',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          isDefault: false
        });
      } else {
        console.error('Failed to update address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const response = await fetch(`/api/customer-profile/addresses?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setAddresses(addresses.filter(addr => addr.id !== id));
      } else {
        console.error('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    
    try {
      // First, unset the current default address
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress && defaultAddress.id !== id) {
        await fetch('/api/customer-profile/addresses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id: defaultAddress.id, 
            firstName: defaultAddress.firstName,
            lastName: defaultAddress.lastName,
            street: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country,
            isDefault: false
          }),
        });
      }
      
      // Then set the selected address as default
      const response = await fetch('/api/customer-profile/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id, 
          firstName: addresses.find(addr => addr.id === id)?.firstName || '',
          lastName: addresses.find(addr => addr.id === id)?.lastName || '',
          street: addresses.find(addr => addr.id === id)?.street || '',
          city: addresses.find(addr => addr.id === id)?.city || '',
          state: addresses.find(addr => addr.id === id)?.state || '',
          postalCode: addresses.find(addr => addr.id === id)?.postalCode || '',
          country: addresses.find(addr => addr.id === id)?.country || '',
          isDefault: true
        }),
      });
      
      if (response.ok) {
        const updatedAddress = await response.json();
        setAddresses(addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === updatedAddress.id
        })));
      }
    } catch (error) {
      console.error('Error setting default address:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-base-100">
        <DashboardNavbar />
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-base-100">
        <DashboardNavbar />
        <div className="hero min-h-96 bg-base-200">
          <div className="text-center hero-content">
            <div className="max-w-md">
              <h1 className="text-3xl font-bold">Access Denied</h1>
              <p className="py-6">You need to be logged in to view this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <DashboardNavbar />
      
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
          
          {/* Tabs */}
          <div className="tabs tabs-boxed mb-6">
            <button 
              className={`tab tab-lg ${activeTab === 'profile' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Information
            </button>
            <button 
              className={`tab tab-lg ${activeTab === 'addresses' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              Address Book
            </button>
          </div>
          
          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center mb-6">
                <div className="avatar mr-4">
                  <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Profile" />
                    ) : (
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {profile?.firstName && profile?.lastName 
                      ? `${profile.firstName} ${profile.lastName}` 
                      : session?.user?.name || 'Unnamed User'}
                  </h2>
                  <p className="text-gray-500">{session?.user?.email}</p>
                </div>
              </div>
              
              {editing ? (
                <form onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="label">
                        <span className="label-text">First Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Last Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="label">
                      <span className="label-text">Phone</span>
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered w-full"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="label">
                      <span className="label-text">Date of Birth</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="label">
                      <span className="label-text">Upload Avatar</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                          {formData.avatar && typeof formData.avatar !== 'string' ? (
                            <img src={URL.createObjectURL(formData.avatar as File)} alt="Preview" />
                          ) : profile?.avatar ? (
                            <img src={profile.avatar} alt="Current Avatar" />
                          ) : (
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                              <span className="text-gray-500">No image</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input file-input-bordered w-full max-w-xs"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    {fileError && <p className="text-error mt-2">{fileError}</p>}
                  </div>
                  
                  <div className="mb-4">
                    <label className="label">
                      <span className="label-text">Gender</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button 
                      type="button" 
                      className="btn btn-ghost"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700">Full Name</h3>
                    <p>{profile?.firstName} {profile?.lastName}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700">Phone</h3>
                    <p>{profile?.phone || 'Not provided'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700">Date of Birth</h3>
                    <p>{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700">Gender</h3>
                    <p>
                      {profile?.gender === 'male' && 'Male'}
                      {profile?.gender === 'female' && 'Female'}
                      {!profile?.gender && 'Not provided'}
                    </p>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Addresses Tab Content */}
          {activeTab === 'addresses' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Addresses</h2>
              
              {/* Add Address Form */}
              <div className="card bg-base-100 shadow-md mb-6">
                <div className="card-body">
                  <h3 className="text-lg font-medium mb-4">Add New Address</h3>
                  <form onSubmit={handleAddressSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="label">
                          <span className="label-text">First Name</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={addressForm.firstName}
                          onChange={(e) => setAddressForm({...addressForm, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text">Last Name</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={addressForm.lastName}
                          onChange={(e) => setAddressForm({...addressForm, lastName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="label">
                        <span className="label-text">Street Address</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="label">
                          <span className="label-text">City</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text">State</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text">Postal Code</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="label">
                        <span className="label-text">Phone</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="label">
                        <span className="label-text">Label</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                        placeholder="Home, Office, etc."
                      />
                    </div>

                    <div className="mb-4">
                      <label className="label">
                        <span className="label-text">Notes</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full"
                        value={addressForm.notes}
                        onChange={(e) => setAddressForm({...addressForm, notes: e.target.value})}
                        placeholder="Delivery instructions, door codes, etc."
                        rows={3}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text">Set as Default</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                        />
                      </label>
                    </div>
                    
                    <button type="submit" className="btn btn-primary">Add Address</button>
                  </form>
                </div>
              </div>
              
              {/* Address List */}
              <div>
                <h3 className="text-lg font-medium mb-4">Saved Addresses</h3>
                
                {addresses.length === 0 ? (
                  <p className="text-gray-500">No addresses saved yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="card bg-base-100 shadow-md">
                        <div className="card-body">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{address.firstName} {address.lastName}</h4>
                              <p>{address.street}</p>
                              <p>{address.city}, {address.state} {address.postalCode}</p>
                              <p>{address.country}</p>
                              {address.phone && <p>Phone: {address.phone}</p>}
                              {address.label && <p className="badge badge-secondary">{address.label}</p>}
                              {address.notes && <p className="text-sm text-gray-500 mt-1">{address.notes}</p>}
                              {address.isDefault && (
                                <span className="badge badge-primary mt-2">Default Address</span>
                              )}
                            </div>
                            <div className="dropdown dropdown-end">
                              <div tabIndex={0} className="btn btn-ghost btn-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                              </div>
                              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44">
                                <li>
                                  <button 
                                    onClick={() => {
                                      setAddressForm({
                                        firstName: address.firstName,
                                        lastName: address.lastName,
                                        street: address.street,
                                        city: address.city,
                                        state: address.state,
                                        postalCode: address.postalCode,
                                        country: address.country,
                                        phone: address.phone,
                                        label: address.label,
                                        notes: address.notes,
                                        isDefault: address.isDefault
                                      });
                                      handleAddressUpdate(address.id);
                                    }}
                                  >
                                    Edit
                                  </button>
                                </li>
                                <li>
                                  {address.isDefault ? (
                                    <span className="text-gray-400" tabIndex={0}>Set as Default</span>
                                  ) : (
                                    <button onClick={() => handleSetDefault(address.id)}>
                                      Set as Default
                                    </button>
                                  )}
                                </li>
                                <li>
                                  <button onClick={() => handleAddressDelete(address.id)}>
                                    Delete
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;