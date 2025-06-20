import React from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card';

const ClientDetail = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Client Details</h1>
      <Card>
        <div className="p-4">
          <p className="text-gray-600">Client ID: {id}</p>
          {/* Placeholder for client details - to be implemented */}
          <p className="text-gray-500 mt-4">Loading client details...</p>
        </div>
      </Card>
    </div>
  );
};

export default ClientDetail;