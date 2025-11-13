'use client';

import { useState, useEffect } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  
  const [profile, setProfile] = useState({
    name: '',
    birthDate: '',
    address: '',
    email: '',
    phone: '',
    photo: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (session?.user) {
      // In a real app, this would come from an API call
      setProfile({
        name: session.user.name || '',
        birthDate: '',
        address: '',
        email: session.user.email || '',
        phone: '',
        photo: session.user.image || ''
      });
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would save to the database
    setIsEditing(false);
    alert('Profil berhasil diperbarui!');
  };

  if (status === 'loading') {
    return <div>Memuat...</div>;
  }

  if (!session) {
    return <div>Anda harus masuk untuk mengakses halaman ini.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Profil Saya</h1>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-6">
          {profile.photo && (
            <img 
              src={profile.photo} 
              alt="Foto Profil" 
              className="w-24 h-24 rounded-full mr-6"
            />
          )}
          <div>
            <h2 className="text-2xl font-semibold">{profile.name}</h2>
            <p className="text-gray-400">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white disabled:bg-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal Lahir</label>
              <input
                type="date"
                name="birthDate"
                value={profile.birthDate}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white disabled:bg-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white disabled:bg-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Telepon</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white disabled:bg-gray-600"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Alamat</label>
              <textarea
                name="address"
                value={profile.address}
                onChange={handleChange}
                disabled={!isEditing}
                rows="3"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white disabled:bg-gray-600"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
                >
                  Batal
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
              >
                Edit Profil
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}