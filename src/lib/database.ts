export interface Workspace {
  id: string;
  name: string;
  isDefault: boolean; // ← Add this field
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface TabGroup {
  id: string;
  workspaceId: string;
  name: string;
  icon: string;
  position: number;
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
}

export interface Tab {
  id: string;
  groupId: string;
  url: string;
  title: string;
  favicon: string;
  position: number;
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
}

export interface DeletedItem {
  id: string;
  type: "tab" | "tabGroup" | "workspace";
  data: Workspace | TabGroup | Tab; // ← More specific than 'any'
  deletedAt: Date;
  originalLocation: string; // ← This is good for restoration
  // Consider adding:
  parentId?: string; // ← For tabs: groupId, for groups: workspaceId
}

// DB Constants
const DB_NAME = "TabulaDB";
const DB_VERSION = 4; // Increment version

// Database Functions
export async function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Failed to connect to database"));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Handle migration from version 2 to 3
      if (oldVersion < 3) {
        // Drop and recreate tabGroups store to remove global unique constraint
        if (db.objectStoreNames.contains("tabGroups")) {
          db.deleteObjectStore("tabGroups");
        }
        
        // Drop and recreate tabs store to add composite index
        if (db.objectStoreNames.contains("tabs")) {
          db.deleteObjectStore("tabs");
        }
      }

      // Create Workspaces Store
      if (!db.objectStoreNames.contains("workspaces")) {
        const workspaceStore = db.createObjectStore("workspaces", {
          keyPath: "id",
        });
        workspaceStore.createIndex("name", "name", { unique: false });
        workspaceStore.createIndex("isDefault", "isDefault", { unique: false });
        workspaceStore.createIndex("createdAt", "createdAt", { unique: false });
        workspaceStore.createIndex("lastAccessedAt", "lastAccessedAt", { unique: false });
      }

      // Create TabGroup Store with scoped position uniqueness
      if (!db.objectStoreNames.contains("tabGroups")) {
        const tabGroupStore = db.createObjectStore("tabGroups", {
          keyPath: "id",
        });
        tabGroupStore.createIndex("workspaceId", "workspaceId", {
          unique: false,
        });
        tabGroupStore.createIndex("name", "name", { unique: false });
        tabGroupStore.createIndex("position", "position", { unique: false }); // Remove global unique
        tabGroupStore.createIndex("workspaceId_position", ["workspaceId", "position"], { 
          unique: true 
        }); // Add composite unique index
        tabGroupStore.createIndex("isArchived", "isArchived", {
          unique: false,
        });
        tabGroupStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create Tab Store with scoped position uniqueness
      if (!db.objectStoreNames.contains("tabs")) {
        const tabStore = db.createObjectStore("tabs", { keyPath: "id" });
        tabStore.createIndex("groupId", "groupId", { unique: false });
        tabStore.createIndex("position", "position", { unique: false });
        tabStore.createIndex("groupId_position", ["groupId", "position"], { 
          unique: true 
        }); // Add composite unique index
        tabStore.createIndex("isArchived", "isArchived", { unique: false });
        tabStore.createIndex("url", "url", { unique: false });
        tabStore.createIndex("title", "title", { unique: false });
        tabStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create Deleted Items Store
      if (!db.objectStoreNames.contains("deletedItems")) {
        const deletedItemStore = db.createObjectStore("deletedItems", { keyPath: "id" });
        deletedItemStore.createIndex("type", "type", { unique: false });
        deletedItemStore.createIndex("deletedAt", "deletedAt", { unique: false });
        deletedItemStore.createIndex("parentId", "parentId", { unique: false });
      }
    };
  });
}

// test function:
export async function testDatabase(): Promise<void> {
  const testWorkspaceId = `test-workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log('🧪 Starting database test...');
    
    // 1. Initialize database
    const db = await getDatabase();
    console.log('✅ Database initialized successfully:', db.name);
    
    // 2. CREATE - Test creating a workspace
    const testWorkspace: Workspace = {
      id: testWorkspaceId,
      name: 'Test Workspace',
      isDefault: false,
      createdAt: new Date(),
      lastAccessedAt: new Date()
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['workspaces'], 'readwrite');
      const store = transaction.objectStore('workspaces');
      
      const addRequest = store.add(testWorkspace);
      
      addRequest.onsuccess = () => {
        console.log('✅ CREATE: Test workspace created successfully');
        resolve();
      };
      
      addRequest.onerror = () => {
        console.error('❌ CREATE: Failed to create test workspace:', addRequest.error);
        reject(addRequest.error);
      };
      
      transaction.oncomplete = () => {
        console.log('✅ Transaction completed successfully');
      };
      
      transaction.onerror = () => {
        console.error('❌ Transaction failed:', transaction.error);
        reject(transaction.error);
      };
    });

    // 3. READ - Test reading the workspace
    const readWorkspace = await new Promise<Workspace>((resolve, reject) => {
      const transaction = db.transaction(['workspaces'], 'readonly');
      const store = transaction.objectStore('workspaces');
      
      const getRequest = store.get(testWorkspaceId);
      
      getRequest.onsuccess = () => {
        console.log('✅ READ: Test workspace retrieved successfully');
        resolve(getRequest.result);
      };
      
      getRequest.onerror = () => {
        console.error('❌ READ: Failed to retrieve test workspace:', getRequest.error);
        reject(getRequest.error);
      };
    });

    // 4. UPDATE - Test updating the workspace
    const updatedWorkspace = { ...readWorkspace, name: 'Updated Test Workspace' };
    
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['workspaces'], 'readwrite');
      const store = transaction.objectStore('workspaces');
      
      const putRequest = store.put(updatedWorkspace);
      
      putRequest.onsuccess = () => {
        console.log('✅ UPDATE: Test workspace updated successfully');
        resolve();
      };
      
      putRequest.onerror = () => {
        console.error('❌ UPDATE: Failed to update test workspace:', putRequest.error);
        reject(putRequest.error);
      };
    });

    // 5. Test TabGroup creation
    const testGroupId = `test-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const testGroup: TabGroup = {
      id: testGroupId,
      workspaceId: testWorkspaceId,
      name: 'Test Tab Group',
      icon: '',
      position: 0,
      isArchived: false,
      createdAt: new Date()
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['tabGroups'], 'readwrite');
      const store = transaction.objectStore('tabGroups');
      
      const addRequest = store.add(testGroup);
      
      addRequest.onsuccess = () => {
        console.log('✅ CREATE: Test tab group created successfully');
        resolve();
      };
      
      addRequest.onerror = () => {
        console.error('❌ CREATE: Failed to create test tab group:', addRequest.error);
        reject(addRequest.error);
      };
    });

    // 6. Test Tab creation
    const testTabId = `test-tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const testTab: Tab = {
      id: testTabId,
      groupId: testGroupId,
      url: 'https://example.com',
      title: 'Test Tab',
      favicon: 'https://example.com/favicon.ico',
      position: 0,
      isArchived: false,
      createdAt: new Date()
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['tabs'], 'readwrite');
      const store = transaction.objectStore('tabs');
      
      const addRequest = store.add(testTab);
      
      addRequest.onsuccess = () => {
        console.log('✅ CREATE: Test tab created successfully');
        resolve();
      };
      
      addRequest.onerror = () => {
        console.error('❌ CREATE: Failed to create test tab:', addRequest.error);
        reject(addRequest.error);
      };
    });

    // 7. CLEANUP - Remove all test data
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['tabs', 'tabGroups', 'workspaces'], 'readwrite');
      const tabStore = transaction.objectStore('tabs');
      const groupStore = transaction.objectStore('tabGroups');
      const workspaceStore = transaction.objectStore('workspaces');
      
      // Delete in reverse dependency order
      const deleteTabRequest = tabStore.delete(testTabId);
      const deleteGroupRequest = groupStore.delete(testGroupId);
      const deleteWorkspaceRequest = workspaceStore.delete(testWorkspaceId);
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 3) {
          console.log('✅ CLEANUP: All test data removed successfully');
          resolve();
        }
      };
      
      deleteTabRequest.onsuccess = checkComplete;
      deleteGroupRequest.onsuccess = checkComplete;
      deleteWorkspaceRequest.onsuccess = checkComplete;
      
      deleteTabRequest.onerror = () => reject(deleteTabRequest.error);
      deleteGroupRequest.onerror = () => reject(deleteGroupRequest.error);
      deleteWorkspaceRequest.onerror = () => reject(deleteWorkspaceRequest.error);
    });

    console.log(' All database tests completed successfully!');
    
  } catch (error) {
    console.error("❌ Database test failed:", error);
    throw error;
  }
}

// Helper function to check if a workspace exists
async function validateWorkspaceExists(workspaceId: string): Promise<boolean> {
  const db = await getDatabase();
  const transaction = db.transaction(['workspaces'], 'readonly');
  const store = transaction.objectStore('workspaces');
  
  return new Promise((resolve, reject) => {
    const request = store.get(workspaceId);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper function to check if a tab group exists
async function validateTabGroupExists(groupId: string): Promise<boolean> {
  const db = await getDatabase();
  const transaction = db.transaction(['tabGroups'], 'readonly');
  const store = transaction.objectStore('tabGroups');
  
  return new Promise((resolve, reject) => {
    const request = store.get(groupId);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper function to check for ID conflicts
async function checkIdConflict(id: string, type: 'workspace' | 'tabGroup' | 'tab'): Promise<boolean> {
  const db = await getDatabase();
  const storeName = type === 'workspace' ? 'workspaces' : type === 'tabGroup' ? 'tabGroups' : 'tabs';
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper function to check if item is within retention period (14 days)
function isWithinRetentionPeriod(deletedAt: Date): boolean {
  const retentionPeriodMs = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
  const cutoffDate = new Date(Date.now() - retentionPeriodMs);
  return deletedAt > cutoffDate;
}

// Restore a deleted item
export async function restoreDeletedItem(deletedItemId: string): Promise<boolean> {
  const db = await getDatabase();
  const transaction = db.transaction(['deletedItems', 'workspaces', 'tabGroups', 'tabs'], 'readwrite');
  const deletedStore = transaction.objectStore('deletedItems');
  const workspaceStore = transaction.objectStore('workspaces');
  const groupStore = transaction.objectStore('tabGroups');
  const tabStore = transaction.objectStore('tabs');

  return new Promise((resolve, reject) => {
    const getRequest = deletedStore.get(deletedItemId);
    
    getRequest.onsuccess = async () => {
      const deletedItem = getRequest.result;
      if (!deletedItem) {
        reject(new Error('Deleted item not found'));
        return;
      }

      try {
        // 1. Check retention period
        if (!isWithinRetentionPeriod(deletedItem.deletedAt)) {
          reject(new Error('Item has exceeded 14-day retention period and cannot be restored'));
          return;
        }

        // 2. Check for ID conflicts
        const hasConflict = await checkIdConflict(deletedItem.id, deletedItem.type);
        if (hasConflict) {
          reject(new Error(`Cannot restore ${deletedItem.type}: ID ${deletedItem.id} already exists`));
          return;
        }

        // 3. Validate parent containers based on type
        switch (deletedItem.type) {
          case 'workspace':
            // Workspaces don't have parent containers, so no validation needed
            break;
            
          case 'tabGroup':
            // Validate that the parent workspace exists
            const workspaceExists = await validateWorkspaceExists(deletedItem.data.workspaceId);
            if (!workspaceExists) {
              reject(new Error(`Cannot restore tab group: parent workspace ${deletedItem.data.workspaceId} does not exist`));
              return;
            }
            break;
            
          case 'tab':
            // Validate that the parent tab group exists
            const groupExists = await validateTabGroupExists(deletedItem.data.groupId);
            if (!groupExists) {
              reject(new Error(`Cannot restore tab: parent tab group ${deletedItem.data.groupId} does not exist`));
              return;
            }
            break;
        }

        // 4. All validations passed, proceed with restoration
        switch (deletedItem.type) {
          case 'workspace':
            workspaceStore.add(deletedItem.data);
            break;
          case 'tabGroup':
            groupStore.add(deletedItem.data);
            break;
          case 'tab':
            tabStore.add(deletedItem.data);
            break;
        }
        
        // 5. Remove from deleted items
        deletedStore.delete(deletedItemId);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Get all deleted items
export async function getDeletedItems(): Promise<DeletedItem[]> {
  const db = await getDatabase();
  const transaction = db.transaction(['deletedItems'], 'readonly');
  const store = transaction.objectStore('deletedItems');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Permanently delete an item (remove from deletedItems)
export async function permanentlyDeleteItem(itemId: string): Promise<boolean> {
  const db = await getDatabase();
  const transaction = db.transaction(['deletedItems'], 'readwrite');
  const deletedStore = transaction.objectStore('deletedItems');

  return new Promise((resolve, reject) => {
    const request = deletedStore.delete(itemId);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Instead of querying by position globally, query by parent + position
export async function getTabGroupByPosition(workspaceId: string, position: number): Promise<TabGroup | null> {
  const db = await getDatabase();
  const transaction = db.transaction(["tabGroups"], "readonly");
  const store = transaction.objectStore("tabGroups");
  const index = store.index("workspaceId_position");
  
  return new Promise((resolve, reject) => {
    const request = index.get([workspaceId, position]);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error("Failed to get tab group"));
  });
}

export async function cleanupExpiredDeletedItems(): Promise<number> {
  const db = await getDatabase();
  const transaction = db.transaction(['deletedItems'], 'readwrite');
  const store = transaction.objectStore('deletedItems');
  
  const cutoffDate = new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)); // 14 days ago
  
  return new Promise((resolve, reject) => {
    // Get all deleted items
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = () => {
      const allDeletedItems = getAllRequest.result;
      let deletedCount = 0;
      
      // Filter items that are older than 14 days
      const expiredItems = allDeletedItems.filter(item => 
        item.deletedAt < cutoffDate
      );
      
      if (expiredItems.length === 0) {
        resolve(0);
        return;
      }
      
      // Delete expired items
      let completedDeletions = 0;
      expiredItems.forEach(item => {
        const deleteRequest = store.delete(item.id);
        
        deleteRequest.onsuccess = () => {
          deletedCount++;
          completedDeletions++;
          
          if (completedDeletions === expiredItems.length) {
            resolve(deletedCount);
          }
        };
        
        deleteRequest.onerror = () => {
          console.error(`Failed to delete expired item ${item.id}:`, deleteRequest.error);
          completedDeletions++;
          
          if (completedDeletions === expiredItems.length) {
            resolve(deletedCount);
          }
        };
      });
    };
    
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
}

/**
 * Get the count of active (non-archived) tabs in a group
 * @param groupId - The ID of the tab group
 * @returns Promise<number> - Count of active tabs
 */
export async function getTabCount(groupId: string): Promise<number> {
  const db = await getDatabase();
  const transaction = db.transaction(["tabs"], "readonly");
  const store = transaction.objectStore("tabs");
  const index = store.index("groupId");

  return new Promise((resolve, reject) => {
    const request = index.getAll(groupId);
    request.onsuccess = () => {
      // Filter out archived tabs in JavaScript
      const activeTabs = request.result.filter((tab: Tab) => !tab.isArchived);
      resolve(activeTabs.length);
    };
    request.onerror = () => reject(new Error("Failed to get tab count"));
  });
}

/**
 * Get the total count of active tabs across all active groups in a workspace
 * @param workspaceId - The ID of the workspace
 * @returns Promise<number> - Total count of active tabs
 */
export async function getWorkSpaceCount(workspaceId: string): Promise<number> {
  try {
    const db = await getDatabase();
    
    // Use a single transaction for both stores
    const transaction = db.transaction(["tabGroups", "tabs"], "readonly");
    const groupStore = transaction.objectStore("tabGroups");
    const tabStore = transaction.objectStore("tabs");

    return new Promise((resolve, reject) => {
      let activeGroupIds: Set<string> = new Set();
      let totalActiveTabs = 0;
      let groupQueryComplete = false;
      let tabQueryComplete = false;

      // Step 1: Get all active groups for the workspace
      const groupRequest = groupStore.index("workspaceId").getAll(workspaceId);
      
      groupRequest.onsuccess = () => {
        try {
          // Filter active groups at database level using the isArchived index
          const activeGroups = groupRequest.result.filter((group: TabGroup) => !group.isArchived);
          
          if (activeGroups.length === 0) {
            resolve(0);
            return;
          }

          // Create a set of active group IDs for efficient lookup
          activeGroupIds = new Set(activeGroups.map(group => group.id));
          groupQueryComplete = true;

          // Step 2: Get all active tabs and filter by active group IDs
          const tabRequest = tabStore.index("isArchived").getAll(IDBKeyRange.only(false));
          
          tabRequest.onsuccess = () => {
            try {
              // Filter tabs that belong to active groups and are not archived
              const activeTabs = tabRequest.result.filter((tab: Tab) => 
                activeGroupIds.has(tab.groupId) && !tab.isArchived
              );
              
              totalActiveTabs = activeTabs.length;
              tabQueryComplete = true;
              
              if (groupQueryComplete && tabQueryComplete) {
                resolve(totalActiveTabs);
              }
            } catch (error) {
              reject(new Error(`Failed to process tab data: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          };

          tabRequest.onerror = () => {
            reject(new Error(`Failed to query tabs from database: ${tabRequest.error?.message || 'Unknown database error'}`));
          };

        } catch (error) {
          reject(new Error(`Failed to process group data: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      groupRequest.onerror = () => {
        reject(new Error(`Failed to query tab groups from database: ${groupRequest.error?.message || 'Unknown database error'}`));
      };

      // Handle transaction completion
      transaction.oncomplete = () => {
        // Transaction completed successfully
      };

      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };

      transaction.onabort = () => {
        reject(new Error(`Database transaction was aborted: ${transaction.error?.message || 'Unknown abort error'}`));
      };
    });

  } catch (error) {
    // Handle database connection errors
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

// ============================================================================
// WORKSPACE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new workspace
 * @param workspace - The workspace object to create
 * @returns Promise<void>
 */
export async function createWorkspace(workspace: Workspace): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["workspaces"], "readwrite");
      const store = transaction.objectStore("workspaces");
      
      const request = store.add(workspace);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        if (request.error?.name === "ConstraintError") {
          reject(new Error(`Workspace with ID '${workspace.id}' already exists`));
        } else {
          reject(new Error(`Failed to create workspace: ${request.error?.message || 'Unknown error'}`));
        }
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get a workspace by ID
 * @param id - The workspace ID
 * @returns Promise<Workspace | null> - The workspace or null if not found
 */
export async function getWorkspace(id: string): Promise<Workspace | null> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["workspaces"], "readonly");
      const store = transaction.objectStore("workspaces");
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get workspace: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get all workspaces
 * @returns Promise<Workspace[]> - Array of all workspaces
 */
export async function getAllWorkspaces(): Promise<Workspace[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["workspaces"], "readonly");
      const store = transaction.objectStore("workspaces");
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get workspaces: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Update a workspace
 * @param id - The workspace ID
 * @param updates - Partial workspace object with fields to update
 * @returns Promise<void>
 */
export async function updateWorkspace(id: string, updates: Partial<Workspace>): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["workspaces"], "readwrite");
      const store = transaction.objectStore("workspaces");
      
      // First get the existing workspace
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingWorkspace = getRequest.result;
        
        if (!existingWorkspace) {
          reject(new Error(`Workspace with ID '${id}' not found`));
          return;
        }
        
        // Merge existing workspace with updates
        const updatedWorkspace: Workspace = {
          ...existingWorkspace,
          ...updates
        };
        
        // Update the workspace
        const updateRequest = store.put(updatedWorkspace);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error(`Failed to update workspace: ${updateRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error(`Failed to get workspace for update: ${getRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Delete a workspace
 * @param id - The workspace ID
 * @returns Promise<void>
 */
export async function deleteWorkspace(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["workspaces"], "readwrite");
      const store = transaction.objectStore("workspaces");
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete workspace: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get the default workspace
 * @returns Promise<Workspace | null> - The default workspace or null if none exists
 */
export async function getDefaultWorkspace(): Promise<Workspace | null> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["workspaces"], "readonly");
      const store = transaction.objectStore("workspaces");
      
      // Use the isDefault index to find the default workspace
      const index = store.index("isDefault");
      const request = index.get(IDBKeyRange.only(true));
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get default workspace: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

// ============================================================================
// TAB GROUP CRUD OPERATIONS
// ============================================================================

/**
 * Create a new tab group
 * @param tabGroup - The tab group object to create
 * @returns Promise<void>
 */
export async function createTabGroup(tabGroup: TabGroup): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readwrite");
      const store = transaction.objectStore("tabGroups");
      
      const request = store.add(tabGroup);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        if (request.error?.name === "ConstraintError") {
          reject(new Error(`Tab group with ID '${tabGroup.id}' already exists`));
        } else {
          reject(new Error(`Failed to create tab group: ${request.error?.message || 'Unknown error'}`));
        }
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get a tab group by ID
 * @param id - The tab group ID
 * @returns Promise<TabGroup | null> - The tab group or null if not found
 */
export async function getTabGroup(id: string): Promise<TabGroup | null> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readonly");
      const store = transaction.objectStore("tabGroups");
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tab group: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get all tab groups for a specific workspace
 * @param workspaceId - The workspace ID
 * @returns Promise<TabGroup[]> - Array of tab groups in the workspace
 */
export async function getTabGroupsByWorkspace(workspaceId: string): Promise<TabGroup[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readonly");
      const store = transaction.objectStore("tabGroups");
      const index = store.index("workspaceId");
      
      const request = index.getAll(workspaceId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tab groups: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get all tab groups (across all workspaces)
 * @returns Promise<TabGroup[]> - Array of all tab groups
 */
export async function getAllTabGroups(): Promise<TabGroup[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readonly");
      const store = transaction.objectStore("tabGroups");
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tab groups: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Update a tab group
 * @param id - The tab group ID
 * @param updates - Partial tab group object with fields to update
 * @returns Promise<void>
 */
export async function updateTabGroup(id: string, updates: Partial<TabGroup>): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readwrite");
      const store = transaction.objectStore("tabGroups");
      
      // First get the existing tab group
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingTabGroup = getRequest.result;
        
        if (!existingTabGroup) {
          reject(new Error(`Tab group with ID '${id}' not found`));
          return;
        }
        
        // Merge existing tab group with updates
        const updatedTabGroup: TabGroup = {
          ...existingTabGroup,
          ...updates
        };
        
        // Update the tab group
        const updateRequest = store.put(updatedTabGroup);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error(`Failed to update tab group: ${updateRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error(`Failed to get tab group for update: ${getRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Delete a tab group
 * @param id - The tab group ID
 * @returns Promise<void>
 */
export async function deleteTabGroup(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readwrite");
      const store = transaction.objectStore("tabGroups");
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete tab group: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get active (non-archived) tab groups for a workspace
 * @param workspaceId - The workspace ID
 * @returns Promise<TabGroup[]> - Array of active tab groups
 */
export async function getActiveTabGroupsByWorkspace(workspaceId: string): Promise<TabGroup[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readonly");
      const store = transaction.objectStore("tabGroups");
      const index = store.index("workspaceId");
      
      const request = index.getAll(workspaceId);
      
      request.onsuccess = () => {
        // Filter out archived tab groups
        const activeGroups = request.result.filter((group: TabGroup) => !group.isArchived);
        resolve(activeGroups);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tab groups: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Archive a tab group (soft delete)
 * @param id - The tab group ID
 * @returns Promise<void>
 */
export async function archiveTabGroup(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readwrite");
      const store = transaction.objectStore("tabGroups");
      
      // First get the existing tab group
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingTabGroup = getRequest.result;
        
        if (!existingTabGroup) {
          reject(new Error(`Tab group with ID '${id}' not found`));
          return;
        }
        
        // Mark as archived
        const archivedTabGroup: TabGroup = {
          ...existingTabGroup,
          isArchived: true,
          archivedAt: new Date()
        };
        
        // Update the tab group
        const updateRequest = store.put(archivedTabGroup);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error(`Failed to archive tab group: ${updateRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error(`Failed to get tab group for archiving: ${getRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Unarchive a tab group (restore from soft delete)
 * @param id - The tab group ID
 * @returns Promise<void>
 */
export async function unarchiveTabGroup(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabGroups"], "readwrite");
      const store = transaction.objectStore("tabGroups");
      
      // First get the existing tab group
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingTabGroup = getRequest.result;
        
        if (!existingTabGroup) {
          reject(new Error(`Tab group with ID '${id}' not found`));
          return;
        }
        
        // Mark as not archived
        const unarchivedTabGroup: TabGroup = {
          ...existingTabGroup,
          isArchived: false,
          archivedAt: undefined
        };
        
        // Update the tab group
        const updateRequest = store.put(unarchivedTabGroup);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error(`Failed to unarchive tab group: ${updateRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error(`Failed to get tab group for unarchiving: ${getRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

// ============================================================================
// TAB CRUD OPERATIONS
// ============================================================================

/**
 * Create a new tab
 * @param tab - The tab object to create
 * @returns Promise<void>
 */
export async function createTab(tab: Tab): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readwrite");
      const store = transaction.objectStore("tabs");
      
      const request = store.add(tab);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        if (request.error?.name === "ConstraintError") {
          reject(new Error(`Tab with ID '${tab.id}' already exists`));
        } else {
          reject(new Error(`Failed to create tab: ${request.error?.message || 'Unknown error'}`));
        }
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get a tab by ID
 * @param id - The tab ID
 * @returns Promise<Tab | null> - The tab or null if not found
 */
export async function getTab(id: string): Promise<Tab | null> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readonly");
      const store = transaction.objectStore("tabs");
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tab: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get all tabs for a specific tab group
 * @param groupId - The tab group ID
 * @returns Promise<Tab[]> - Array of tabs in the group
 */
export async function getTabsByGroup(groupId: string): Promise<Tab[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readonly");
      const store = transaction.objectStore("tabs");
      const index = store.index("groupId");
      
      const request = index.getAll(groupId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tabs: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get all tabs (across all groups)
 * @returns Promise<Tab[]> - Array of all tabs
 */
export async function getAllTabs(): Promise<Tab[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readonly");
      const store = transaction.objectStore("tabs");
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tabs: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Update a tab
 * @param id - The tab ID
 * @param updates - Partial tab object with fields to update
 * @returns Promise<void>
 */
export async function updateTab(id: string, updates: Partial<Tab>): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readwrite");
      const store = transaction.objectStore("tabs");
      
      // First get the existing tab
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingTab = getRequest.result;
        
        if (!existingTab) {
          reject(new Error(`Tab with ID '${id}' not found`));
          return;
        }
        
        // Merge existing tab with updates
        const updatedTab: Tab = {
          ...existingTab,
          ...updates
        };
        
        // Update the tab
        const updateRequest = store.put(updatedTab);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error(`Failed to update tab: ${updateRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error(`Failed to get tab for update: ${getRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Delete a tab
 * @param id - The tab ID
 * @returns Promise<void>
 */
export async function deleteTab(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readwrite");
      const store = transaction.objectStore("tabs");
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete tab: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get active (non-archived) tabs for a tab group
 * @param groupId - The tab group ID
 * @returns Promise<Tab[]> - Array of active tabs
 */
export async function getActiveTabsByGroup(groupId: string): Promise<Tab[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readonly");
      const store = transaction.objectStore("tabs");
      const index = store.index("groupId");
      
      const request = index.getAll(groupId);
      
      request.onsuccess = () => {
        // Filter out archived tabs
        const activeTabs = request.result.filter((tab: Tab) => !tab.isArchived);
        resolve(activeTabs);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tabs: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Archive a tab (soft delete)
 * @param id - The tab ID
 * @returns Promise<void>
 */
export async function archiveTab(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readwrite");
      const store = transaction.objectStore("tabs");
      
      // First get the existing tab
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingTab = getRequest.result;
        
        if (!existingTab) {
          reject(new Error(`Tab with ID '${id}' not found`));
          return;
        }
        
        // Mark as archived
        const archivedTab: Tab = {
          ...existingTab,
          isArchived: true,
          archivedAt: new Date()
        };
        
        // Update the tab
        const updateRequest = store.put(archivedTab);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error(`Failed to archive tab: ${updateRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error(`Failed to get tab for archiving: ${getRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Unarchive a tab (restore from soft delete)
 * @param id - The tab ID
 * @returns Promise<void>
 */
export async function unarchiveTab(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readwrite");
      const store = transaction.objectStore("tabs");
      
      // First get the existing tab
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingTab = getRequest.result;
        
        if (!existingTab) {
          reject(new Error(`Tab with ID '${id}' not found`));
          return;
        }
        
        // Mark as not archived
        const unarchivedTab: Tab = {
          ...existingTab,
          isArchived: false,
          archivedAt: undefined
        };
        
        // Update the tab
        const updateRequest = store.put(unarchivedTab);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error(`Failed to unarchive tab: ${updateRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error(`Failed to get tab for unarchiving: ${getRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Search tabs by title or URL
 * @param searchTerm - The search term to look for
 * @param groupId - Optional: limit search to a specific group
 * @returns Promise<Tab[]> - Array of matching tabs
 */
export async function searchTabs(searchTerm: string, groupId?: string): Promise<Tab[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readonly");
      const store = transaction.objectStore("tabs");
      
      // If groupId is provided, search within that group
      if (groupId) {
        const index = store.index("groupId");
        const request = index.getAll(groupId);
        
        request.onsuccess = () => {
          const tabs = request.result || [];
          const matchingTabs = tabs.filter((tab: Tab) => 
            tab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tab.url.toLowerCase().includes(searchTerm.toLowerCase())
          );
          resolve(matchingTabs);
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to search tabs: ${request.error?.message || 'Unknown error'}`));
        };
      } else {
        // Search across all tabs
        const request = store.getAll();
        
        request.onsuccess = () => {
          const tabs = request.result || [];
          const matchingTabs = tabs.filter((tab: Tab) => 
            tab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tab.url.toLowerCase().includes(searchTerm.toLowerCase())
          );
          resolve(matchingTabs);
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to search tabs: ${request.error?.message || 'Unknown error'}`));
        };
      }
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get tabs by URL (useful for finding duplicates)
 * @param url - The URL to search for
 * @returns Promise<Tab[]> - Array of tabs with matching URL
 */
export async function getTabsByUrl(url: string): Promise<Tab[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["tabs"], "readonly");
      const store = transaction.objectStore("tabs");
      const index = store.index("url");
      
      const request = index.getAll(url);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get tabs by URL: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

// ============================================================================
// DELETED ITEM CRUD OPERATIONS
// ============================================================================

/**
 * Create a new deleted item
 * @param deletedItem - The deleted item object to create
 * @returns Promise<void>
 */
export async function createDeletedItem(deletedItem: DeletedItem): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readwrite");
      const store = transaction.objectStore("deletedItems");
      
      const request = store.add(deletedItem);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        if (request.error?.name === "ConstraintError") {
          reject(new Error(`Deleted item with ID '${deletedItem.id}' already exists`));
        } else {
          reject(new Error(`Failed to create deleted item: ${request.error?.message || 'Unknown error'}`));
        }
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get a deleted item by ID
 * @param id - The deleted item ID
 * @returns Promise<DeletedItem | null> - The deleted item or null if not found
 */
export async function getDeletedItem(id: string): Promise<DeletedItem | null> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readonly");
      const store = transaction.objectStore("deletedItems");
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get deleted item: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get all deleted items
 * @returns Promise<DeletedItem[]> - Array of all deleted items
 */
export async function getAllDeletedItems(): Promise<DeletedItem[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readonly");
      const store = transaction.objectStore("deletedItems");
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get deleted items: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Update a deleted item
 * @param id - The deleted item ID
 * @param updates - Partial deleted item object with fields to update
 * @returns Promise<void>
 */
export async function updateDeletedItem(id: string, updates: Partial<DeletedItem>): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readwrite");
      const store = transaction.objectStore("deletedItems");
      
      // First get the existing deleted item
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingDeletedItem = getRequest.result;
        
        if (!existingDeletedItem) {
          reject(new Error(`Deleted item with ID '${id}' not found`));
          return;
        }
        
        // Merge existing deleted item with updates
        const updatedDeletedItem: DeletedItem = {
          ...existingDeletedItem,
          ...updates
        };
        
        // Update the deleted item
        const updateRequest = store.put(updatedDeletedItem);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error(`Failed to update deleted item: ${updateRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      getRequest.onerror = () => {
        reject(new Error(`Failed to get deleted item for update: ${getRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Delete a deleted item (permanently remove from trash)
 * @param id - The deleted item ID
 * @returns Promise<void>
 */
export async function deleteDeletedItem(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readwrite");
      const store = transaction.objectStore("deletedItems");
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete item: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get deleted items by type
 * @param type - The type of deleted items to retrieve
 * @returns Promise<DeletedItem[]> - Array of deleted items of the specified type
 */
export async function getDeletedItemsByType(type: "tab" | "tabGroup" | "workspace"): Promise<DeletedItem[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readonly");
      const store = transaction.objectStore("deletedItems");
      const index = store.index("type");
      
      const request = index.getAll(type);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get deleted items by type: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get deleted items by parent ID
 * @param parentId - The parent ID to search for
 * @returns Promise<DeletedItem[]> - Array of deleted items with the specified parent ID
 */
export async function getDeletedItemsByParentId(parentId: string): Promise<DeletedItem[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readonly");
      const store = transaction.objectStore("deletedItems");
      const index = store.index("parentId");
      
      const request = index.getAll(parentId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get deleted items by parent ID: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get deleted items within retention period (not expired)
 * @returns Promise<DeletedItem[]> - Array of non-expired deleted items
 */
export async function getNonExpiredDeletedItems(): Promise<DeletedItem[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readonly");
      const store = transaction.objectStore("deletedItems");
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allItems = request.result || [];
        const nonExpiredItems = allItems.filter(item => isWithinRetentionPeriod(item.deletedAt));
        resolve(nonExpiredItems);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get deleted items: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get expired deleted items (beyond retention period)
 * @returns Promise<DeletedItem[]> - Array of expired deleted items
 */
export async function getExpiredDeletedItems(): Promise<DeletedItem[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readonly");
      const store = transaction.objectStore("deletedItems");
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allItems = request.result || [];
        const expiredItems = allItems.filter(item => !isWithinRetentionPeriod(item.deletedAt));
        resolve(expiredItems);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get deleted items: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get deleted items sorted by deletion date (newest first)
 * @returns Promise<DeletedItem[]> - Array of deleted items sorted by deletedAt
 */
export async function getDeletedItemsSortedByDate(): Promise<DeletedItem[]> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readonly");
      const store = transaction.objectStore("deletedItems");
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allItems = request.result || [];
        const sortedItems = allItems.sort((a, b) => 
          new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
        );
        resolve(sortedItems);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get deleted items: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}

/**
 * Get count of deleted items by type
 * @param type - The type to count
 * @returns Promise<number> - Count of deleted items of the specified type
 */
export async function getDeletedItemCountByType(type: "tab" | "tabGroup" | "workspace"): Promise<number> {
  try {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["deletedItems"], "readonly");
      const store = transaction.objectStore("deletedItems");
      const index = store.index("type");
      
      const request = index.count(type);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to count deleted items by type: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.onerror = () => {
        reject(new Error(`Database transaction failed: ${transaction.error?.message || 'Unknown transaction error'}`));
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown connection error'}`);
  }
}
