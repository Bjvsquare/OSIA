import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
    Building2, Globe, MapPin, Users, Calendar,
    Briefcase, ExternalLink, ArrowLeft
} from 'lucide-react';
import { api } from '../../../services/api';

interface Organization {
    id: string;
    name: string;
    slug: string;
    type: string;
    industry: string;
    size: string;
    description?: string;
    headquarters?: string;
    foundedYear?: number;
    website?: string;
    logo?: string;
}

export function OrganizationPublicProfile() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [org, setOrg] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadOrganization();
    }, [slug]);

    const loadOrganization = async () => {
        if (!slug) return;

        setIsLoading(true);
        try {
            const res = await api.getOrganizationBySlug(slug);
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Organization not found');
                } else {
                    throw new Error('Failed to load organization');
                }
                return;
            }
            const data = await res.json();
            setOrg(data);
        } catch (err) {
            setError('Failed to load organization');
        } finally {
            setIsLoading(false);
        }
    };

    const getSizeLabel = (size: string) => {
        const sizes: Record<string, string> = {
            startup: '1-10 employees',
            small: '11-50 employees',
            medium: '51-200 employees',
            large: '201-1000 employees',
            enterprise: '1000+ employees'
        };
        return sizes[size] || size;
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            company: 'Company',
            nonprofit: 'Non-Profit',
            government: 'Government Agency',
            education: 'Educational Institution',
            other: 'Organization'
        };
        return types[type] || type;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-osia-neutral-400">Loading organization...</p>
                </div>
            </div>
        );
    }

    if (error || !org) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-8 text-center bg-osia-deep-900/60 border-white/5">
                    <Building2 className="w-16 h-16 text-osia-neutral-600 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-white mb-2">
                        Organization Not Found
                    </h1>
                    <p className="text-osia-neutral-400 mb-6">
                        The organization you're looking for doesn't exist or is not publicly visible.
                    </p>
                    <Button onClick={() => navigate('/')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Home
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-6">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-osia-neutral-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Header Card */}
                    <Card className="p-8 bg-osia-deep-900/60 border-white/5 mb-6">
                        <div className="flex items-start gap-6">
                            {/* Logo */}
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                                {org.logo ? (
                                    <img src={org.logo} alt={org.name} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    <Building2 className="w-12 h-12 text-white" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white mb-2">{org.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-osia-neutral-400">
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="w-4 h-4" />
                                        {getTypeLabel(org.type)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        {org.industry}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {getSizeLabel(org.size)}
                                    </span>
                                </div>

                                {/* Additional Info */}
                                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-osia-neutral-500">
                                    {org.headquarters && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {org.headquarters}
                                        </span>
                                    )}
                                    {org.foundedYear && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Founded {org.foundedYear}
                                        </span>
                                    )}
                                    {org.website && (
                                        <a
                                            href={org.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Website
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* CTA */}
                            <Button
                                onClick={() => navigate(`/signup/join-organization?org=${org.id}`)}
                                className="bg-gradient-to-r from-purple-600 to-purple-700 flex-shrink-0"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Join Organization
                            </Button>
                        </div>

                        {/* Description */}
                        {org.description && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-osia-neutral-300 leading-relaxed">
                                    {org.description}
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Public URL Info */}
                    <Card className="p-4 bg-osia-deep-900/40 border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-osia-neutral-500">
                                <span className="text-osia-neutral-400">Public Profile URL:</span>{' '}
                                <code className="text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                                    {window.location.origin}/org/{org.slug}
                                </code>
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/org/${org.slug}`)}
                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Copy Link
                            </button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
