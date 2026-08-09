'use client';

import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/AuthGuard';
import { useEffect, useState } from 'react';
import { familyApi } from '@/lib/api';
import { User, Relationship } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const FamilyTreeLegend = () => (
  <div className="absolute bottom-4 left-4 bg-white rounded-xl border-2 border-gray-200 p-4 shadow-md w-64 z-10 pointer-events-none">
    <h3 className="font-bold text-gray-900 mb-3 text-sm">Legend</h3>
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
        </div>
        <span className="text-xs text-gray-600">Male</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
            F
          </div>
        </div>
        <span className="text-xs text-gray-600">Female</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-0.5 w-8 bg-pink-400"></div>
        <span className="text-xs text-gray-600">Marriage</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-0.5 w-8 bg-gray-300"></div>
        <span className="text-xs text-gray-600">Parent-Child</span>
      </div>
    </div>
  </div>
);

// Family Tree Visualization Component
interface FamilyTreeProps {
  nodes: User[];
  edges: Relationship[];
}

interface TreeNode extends User {
  spouse?: User;
  children?: TreeNode[];
}

// Extract buildTree out of the component
function buildTree(nodes: User[], edges: Relationship[]): TreeNode[] {
  // Find nodes that have at least one connection
  const connectedNodeIds = new Set<string>();
  edges.forEach(edge => {
    connectedNodeIds.add(edge.fromUserId);
    connectedNodeIds.add(edge.toUserId);
  });

  // Find root nodes (people without parents in the tree)
  const childIds = new Set<string>();
  edges.forEach(edge => {
    if (edge.relationshipType === 'Father' || edge.relationshipType === 'Mother') {
      childIds.add(edge.fromUserId);
    }
  });

  // Only include root nodes that are actually connected to someone
  const rootNodes = nodes.filter(node => !childIds.has(node.userId) && connectedNodeIds.has(node.userId));

  // Group couples
  const couples = new Map<string, User>();
  edges.forEach(edge => {
    if (edge.relationshipType === 'Husband' || edge.relationshipType === 'Wife') {
      couples.set(edge.fromUserId, nodes.find(n => n.userId === edge.toUserId)!);
    }
  });

  // Build tree recursively
  const buildNodeTree = (person: User): TreeNode => {
    const spouse = couples.get(person.userId);
    
    // Find children
    const childrenIds = new Set<string>();
    edges.forEach(edge => {
      if ((edge.toUserId === person.userId || edge.toUserId === spouse?.userId) &&
          (edge.relationshipType === 'Father' || edge.relationshipType === 'Mother')) {
        childrenIds.add(edge.fromUserId);
      }
    });

    const children = Array.from(childrenIds)
      .map(id => nodes.find(n => n.userId === id))
      .filter(n => n !== undefined)
      .map(child => buildNodeTree(child as User));

    return {
      ...person,
      spouse,
      children: children.length > 0 ? children : undefined
    };
  };

  return rootNodes.map(root => buildNodeTree(root));
}

function FamilyTreeVisualization({ nodes, edges }: FamilyTreeProps) {
  const router = useRouter();
  const treeRoots = buildTree(nodes, edges);

  // Render a person card
  const PersonCard = ({ person, isSpouse = false }: { person: User; isSpouse?: boolean }) => (
    <div
      className={`bg-white rounded-lg border-2 ${isSpouse ? 'border-pink-200' : 'border-indigo-200'} p-4 shadow-sm hover:shadow-md transition cursor-pointer min-w-[180px]`}
      onClick={() => router.push(`/profile/${person.userId}`)}
    >
      <div className="flex flex-col items-center">
        {person.profilePhotoUrl ? (
          <img
            src={person.profilePhotoUrl}
            alt={person.fullName}
            className="h-16 w-16 rounded-full object-cover border-2 border-indigo-100"
          />
        ) : (
          <div className={`h-16 w-16 rounded-full ${person.gender === 'Female' ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} flex items-center justify-center text-2xl font-bold text-white`}>
            {person.fullName.charAt(0).toUpperCase()}
          </div>
        )}

        <h3 className="font-bold text-gray-900 text-sm mt-2 text-center">{person.fullName}</h3>
        
        {person.dateOfBirth && (
          <p className="text-xs text-gray-500 mt-1">
            {new Date(person.dateOfBirth).getFullYear()}
          </p>
        )}
        
        <div className={`mt-2 px-2 py-1 ${person.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'} text-xs font-medium rounded-full`}>
          {person.gender === 'Female' ? '♀' : '♂'} {person.gender}
        </div>
      </div>
    </div>
  );

  // Render tree node recursively
  const TreeNodeComponent = ({ node, level = 0 }: { node: TreeNode; level?: number }) => (
    <div className="flex flex-col items-center">
      {/* Couple Row */}
      <div className="flex items-center gap-4 mb-6">
        <PersonCard person={node} />
        
        {node.spouse && (
          <>
            {/* Marriage Line */}
            <div className="flex items-center">
              <div className="h-0.5 w-12 bg-pink-400"></div>
              <div className="h-6 w-6 rounded-full bg-pink-100 flex items-center justify-center border-2 border-pink-400">
                <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="h-0.5 w-12 bg-pink-400"></div>
            </div>
            
            <PersonCard person={node.spouse} isSpouse />
          </>
        )}
      </div>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Vertical line down */}
          <div className="h-8 w-0.5 bg-gray-300"></div>
          
          {/* Horizontal line across children */}
          {node.children.length > 1 && (
            <div className="relative w-full flex justify-center">
              <div className="absolute top-0 h-0.5 bg-gray-300" style={{ 
                width: `${(node.children.length - 1) * 220}px`,
                left: '50%',
                transform: 'translateX(-50%)'
              }}></div>
            </div>
          )}

          {/* Children row */}
          <div className="flex gap-12 pt-8">
            {node.children.map((child) => (
              <div key={child.userId} className="relative flex-shrink-0">
                {/* Vertical line to child */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-0.5 bg-gray-300"></div>
                
                <TreeNodeComponent node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 min-w-max min-h-max flex justify-center items-center">
      <div className="inline-block">
        <div className="flex flex-col gap-16">
          {treeRoots.map(root => (
            <TreeNodeComponent key={root.userId} node={root} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FolderTreeView({ nodes, edges }: FamilyTreeProps) {
  const router = useRouter();
  const treeRoots = buildTree(nodes, edges);

  const FolderNode = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div className="ml-6 border-l-2 border-gray-100 pl-4 py-2">
        <details className="group" open>
          <summary className="flex items-center gap-3 cursor-pointer list-none hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200">
            <span className="text-gray-400 group-open:text-indigo-600 transition-colors w-5 flex justify-center">
              {hasChildren ? (
                <svg className="w-5 h-5 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              )}
            </span>
            
            <span className="text-xl">{hasChildren ? '📁' : '📄'}</span>
            
            <div className="flex flex-col flex-1" onClick={(e) => {
              // Prevent details toggle if they click the name to go to profile
              e.preventDefault();
              router.push(`/profile/${node.userId}`);
            }}>
              <span className="font-semibold text-gray-900 flex items-center gap-2 hover:text-indigo-600 hover:underline">
                {node.fullName} 
                <span className={`text-xs px-2 py-0.5 rounded-full ${node.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                  {node.gender === 'Female' ? '♀' : '♂'}
                </span>
              </span>
              {node.spouse && (
                <span className="text-xs text-gray-500 mt-0.5">
                  ⚭ Married to {node.spouse.fullName}
                </span>
              )}
            </div>
          </summary>
          
          {hasChildren && (
            <div className="mt-1">
              {node.children!.map(child => (
                <FolderNode key={child.userId} node={child} level={level + 1} />
              ))}
            </div>
          )}
        </details>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 min-h-[600px] shadow-sm">
      <div className="-ml-6">
        {treeRoots.map(root => (
          <FolderNode key={root.userId} node={root} />
        ))}
      </div>
    </div>
  );
}

export default function FamilyTreePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [treeData, setTreeData] = useState<{ nodes: User[]; edges: Relationship[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'graphical' | 'folder'>('folder');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const data = await familyApi.getMyFamilyTree();
        setTreeData(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load family tree');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, router]);

  if (!session) {
    return <div></div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar - Same as Dashboard */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              <span className="text-xl font-bold text-gray-900">KinLink</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">📊</span>
              <span>Dashboard</span>
            </Link>

            
            <Link
              href="/tree"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium"
            >
              <span className="text-lg">🌳</span>
              <span>Family Tree</span>
            </Link>

            <Link
              href="/members"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">👥</span>
              <span>Members</span>
            </Link>

            <Link
              href="/invitations"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">📧</span>
              <span>Invitations</span>
            </Link>

            <Link
              href="/requests"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">📬</span>
              <span>Requests</span>
            </Link>

            <Link
              href="/birthdays"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">🎂</span>
              <span>Birthdays</span>
            </Link>

            <Link
              href="/branches"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">🌿</span>
              <span>Branches</span>
            </Link>

            <Link
              href="/messages"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">💬</span>
              <span>Messages</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </Link>
          </nav>

          {/* Upgrade Section */}
          <div className="p-4 m-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👑</span>
              <span className="font-bold text-sm text-gray-900">Upgrade to Premium</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">Unlock advanced features</p>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition">
              Upgrade Now
            </button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{session.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">View Profile</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {/* Top Navigation */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Back</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/tree" className="text-sm text-indigo-600 font-medium border-b-2 border-indigo-600 pb-1">
                  Family Tree
                </Link>
                <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">
                  Settings
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                  Profile
                </button>
              </div>
            </div>
          </div>

          {/* Page Header */}
          <div className="px-8 py-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Family Tree Diagram</h1>
                <p className="text-sm text-gray-600 mt-1">Visualize your family connections and relationships</p>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Dashboard
              </Link>
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-8 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search family member..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>

                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('graphical')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'graphical' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Graphical
                  </button>
                  <button
                    onClick={() => setViewMode('folder')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'folder' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Folder
                  </button>
                </div>

                {session.user?.isAdmin && (
                  <button
                    onClick={() => router.push('/invitations')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Member
                  </button>
                )}

                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tree Content Area */}
          <div className="p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : treeData && treeData.nodes.length > 0 ? (
              <div className="space-y-6">
                {viewMode === 'graphical' ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-0 min-h-[600px] overflow-hidden relative cursor-grab active:cursor-grabbing">
                    <TransformWrapper
                      initialScale={1}
                      minScale={0.1}
                      maxScale={4}
                      centerOnInit={true}
                      wheel={{ step: 0.1 }}
                    >
                      {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-md border border-gray-200 pointer-events-auto">
                            <button onClick={() => zoomIn()} className="p-2 hover:bg-gray-100 rounded text-gray-700 transition" title="Zoom In">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button onClick={() => zoomOut()} className="p-2 hover:bg-gray-100 rounded text-gray-700 transition" title="Zoom Out">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            </button>
                            <button onClick={() => resetTransform()} className="p-2 hover:bg-gray-100 rounded text-gray-700 transition" title="Reset Zoom">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                          </div>
                          <FamilyTreeLegend />
                          <TransformComponent wrapperStyle={{ width: "100%", height: "600px" }}>
                            <FamilyTreeVisualization nodes={treeData.nodes} edges={treeData.edges} />
                          </TransformComponent>
                        </>
                      )}
                    </TransformWrapper>
                  </div>
                ) : (
                  <FolderTreeView nodes={treeData.nodes} edges={treeData.edges} />
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <span className="text-6xl mb-4 block">🌳</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Family Tree Yet</h3>
                <p className="text-gray-600 mb-6">Start building your family tree by adding members</p>
                {session.user?.isAdmin && (
                  <button
                    onClick={() => router.push('/invitations')}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                  >
                    Add First Member
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
