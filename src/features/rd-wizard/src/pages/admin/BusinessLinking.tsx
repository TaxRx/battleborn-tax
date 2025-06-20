import React, { useEffect, useState } from 'react';
import { getAllBusinesses, getAllBusinessLinks, linkBusinessToUser, unlinkBusinessFromUser } from '../../services/businessService';
import { getAllUsers } from '../../services/userService';
import { createChangelogEntry } from '../../services/changelogService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { Business, BusinessLink, User } from '../../types';
import { toast } from 'react-hot-toast';

const BusinessLinking: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [links, setLinks] = useState<BusinessLink[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchBusiness, setSearchBusiness] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllUsers().then((response) => {
      if (response?.data) {
        setUsers(response.data.filter((u: User) => u.role === 'client'));
      }
      if (response?.error) {
        toast.error(response.error);
      }
    });
    getAllBusinesses().then((response) => {
      if (response?.data) {
        setBusinesses(response.data);
      }
      if (response?.error) {
        toast.error(response.error);
      }
    });
    getAllBusinessLinks().then((response) => {
      if (response?.data) {
        setLinks(response.data);
      }
      if (response?.error) {
        toast.error(response.error);
      }
      setLoading(false);
    });
  }, []);

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );
  const filteredBusinesses = businesses.filter(b =>
    b.name?.toLowerCase().includes(searchBusiness.toLowerCase())
  );

  const userOptions = filteredUsers.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }));
  const businessOptions = filteredBusinesses.map(b => ({ value: b.id, label: b.name }));

  const userLinks = links.filter(l => l.user_id === selectedUser);
  const businessLinks = links.filter(l => l.business_id === selectedBusiness);

  const handleLink = async () => {
    if (!selectedUser || !selectedBusiness) {
      toast.error('Please select both a user and a business');
      return;
    }

    setLinking(true);
    try {
      const response = await linkBusinessToUser(selectedUser, selectedBusiness);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      if (response.data) {
        setLinks([...links, response.data]);
        toast.success('Business linked successfully');
        setSelectedUser('');
        setSelectedBusiness('');
      }
    } catch (error) {
      toast.error('Failed to link business');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (linkId: string) => {
    try {
      const response = await unlinkBusinessFromUser(linkId);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      if (response.data) {
        setLinks(links.filter(l => l.id !== linkId));
        toast.success('Business unlinked successfully');
      }
    } catch (error) {
      toast.error('Failed to unlink business');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Link Business to User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Search users..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                options={userOptions}
                label="Select user"
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="Search businesses..."
                value={searchBusiness}
                onChange={(e) => setSearchBusiness(e.target.value)}
              />
              <Select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                options={businessOptions}
                label="Select business"
              />
            </div>
          </div>
          <Button
            onClick={handleLink}
            disabled={!selectedUser || !selectedBusiness || linking}
            isLoading={linking}
          >
            Link Business
          </Button>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current Business Links</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {links.map((link) => {
                  const user = users.find(u => u.id === link.user_id);
                  const business = businesses.find(b => b.id === link.business_id);
                  return (
                    <tr key={link.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user ? `${user.name} (${user.email})` : 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {business ? business.name : 'Unknown Business'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="danger"
                          onClick={() => handleUnlink(link.id)}
                        >
                          Unlink
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BusinessLinking; 