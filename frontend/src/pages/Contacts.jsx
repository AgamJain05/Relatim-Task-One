import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Users, 
  MessageCircle, 
  Phone, 
  MoreVertical,
  Star,
  Trash2,
  Edit3,
  X,
  Check
} from 'lucide-react'
import { contactAPI } from '../services/api'
import toast from 'react-hot-toast'

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [selectedContactName, setSelectedContactName] = useState('')
  const [selectedContactNumber, setSelectedContactNumber] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery(
    ['contacts', searchTerm],
    () => contactAPI.getContacts({ search: searchTerm }),
    {
      keepPreviousData: true,
    }
  )

  // Search users for adding contacts
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery(
    ['searchUsers', userSearchTerm],
    () => contactAPI.searchUsers(userSearchTerm),
    {
      enabled: userSearchTerm.length >= 2,
      keepPreviousData: false,
      refetchOnWindowFocus: false,
      retry: false,
      refetchOnMount: true,
    }
  )

  // Add contact mutation
  const addContactMutation = useMutation(contactAPI.addContact, {
    onSuccess: () => {
      queryClient.invalidateQueries('contacts')
      setShowAddModal(false)
      setUserSearchTerm('')
      setSelectedContactName('')
      setSelectedContactNumber('')
      toast.success('Contact added successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add contact')
    },
  })

  // Update contact mutation
  const updateContactMutation = useMutation(
    ({ contactId, ...data }) => contactAPI.updateContact(contactId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('contacts')
        setEditingContact(null)
        toast.success('Contact updated successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update contact')
      },
    }
  )

  // Delete contact mutation
  const deleteContactMutation = useMutation(contactAPI.deleteContact, {
    onSuccess: () => {
      queryClient.invalidateQueries('contacts')
      toast.success('Contact deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete contact')
    },
  })

  const handleAddContact = (user) => {
    addContactMutation.mutate({
      contactUserId: user.id,
      contactName: selectedContactName || user.name,
      contactNumber: selectedContactNumber || '',
    })
  }

  const handleUpdateContact = (contactId, data) => {
    updateContactMutation.mutate({ contactId, ...data })
  }

  const handleDeleteContact = (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContactMutation.mutate(contactId)
    }
  }

  const handleStartChat = (contact) => {
    console.log('Starting chat with contact:', contact)
    console.log('Navigating to:', `/chat/${contact.contactUserId}`)
    
    // Navigate to specific chat URL
    navigate(`/chat/${contact.contactUserId}`)
    
    // Also log the current location after navigation
    setTimeout(() => {
      console.log('Current location after navigation:', window.location.pathname)
    }, 100)
  }

  const contacts = contactsData?.data?.data?.contacts || []
  const users = usersData?.data?.data?.users || []

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp-600 hover:bg-whatsapp-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-whatsapp-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {contactsLoading ? (
          <div className="p-6 text-center text-gray-500">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add your first contact to start messaging
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp-600 hover:bg-whatsapp-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleStartChat(contact)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {contact.contactName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {contact.contactUser?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      {contact.isFavorite && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Star className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingContact === contact.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            defaultValue={contact.contactName}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-whatsapp-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateContact(contact.id, { contactName: e.target.value })
                              }
                            }}
                            autoFocus
                          />
                          <input
                            type="text"
                            defaultValue={contact.contactNumber || ''}
                            placeholder="Phone number"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-whatsapp-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateContact(contact.id, { contactNumber: e.target.value })
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.contactName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {contact.contactUser?.email}
                          </p>
                          {contact.contactNumber && (
                            <p className="text-xs text-gray-500">
                              {contact.contactNumber}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {editingContact === contact.id ? (
                      <>
                                              <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingContact(null)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateContact(contact.id, {})
                          }}
                          className="p-2 text-whatsapp-600 hover:text-whatsapp-700 rounded-lg hover:bg-whatsapp-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartChat(contact)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Phone className="w-4 h-4" />
                        </button>
                        <div className="relative group">
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingContact(contact.id)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateContact(contact.id, { isFavorite: !contact.isFavorite })
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                {contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteContact(contact.id)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Contact</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Search Users */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-whatsapp-500"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* User Search Results */}
              {userSearchTerm.length >= 2 && (
                <div className="mb-4 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {usersLoading ? (
                    <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
                  ) : usersError ? (
                    <div className="p-3 text-center text-red-500 text-sm">Error loading users: {usersError.message}</div>
                  ) : !usersData || !usersData.data || !usersData.data.data || !usersData.data.data.users || usersData.data.data.users.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      No users found
                      {/* Debug info */}
                      <div className="text-xs mt-1">
                        Search: "{userSearchTerm}" | Data: {usersData ? 'Yes' : 'No'} | Users: {users.length}
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {users.map((user) => (
                        <div key={user.id} className="p-3 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddContact(user)}
                              disabled={addContactMutation.isLoading}
                              className="px-3 py-1 text-xs font-medium text-whatsapp-600 bg-whatsapp-50 rounded-md hover:bg-whatsapp-100 disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Contact Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Custom name for this contact"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-whatsapp-500"
                    value={selectedContactName}
                    onChange={(e) => setSelectedContactName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contact's phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-whatsapp-500"
                    value={selectedContactNumber}
                    onChange={(e) => setSelectedContactNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contacts
