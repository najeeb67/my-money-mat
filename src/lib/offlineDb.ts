import lf from 'lovefield';

// Database instance
let db: lf.Database | null = null;
let mutationQueueTable: lf.schema.Table | null = null;

export interface MutationRequest {
    id: string;
    mutationKey: string;
    variables: any;
    createdAt: Date;
}

/**
 * Initialize the Offline Database
 */
export async function initOfflineDb(): Promise<lf.Database> {
    if (db) return db;

    const schemaBuilder = lf.schema.create('MoneyMateOfflineDB', 1);

    // Mutation Queue Table
    schemaBuilder.createTable('MutationQueue')
        .addColumn('id', lf.Type.STRING)
        .addColumn('mutationKey', lf.Type.STRING)
        .addColumn('variables', lf.Type.OBJECT)
        .addColumn('createdAt', lf.Type.DATE_TIME)
        .addPrimaryKey(['id']);

    db = await schemaBuilder.connect();
    mutationQueueTable = db.getSchema().table('MutationQueue');

    return db;
}

/**
 * Get Mutation Queue Table
 */
async function getQueueTable() {
    await initOfflineDb();
    if (!mutationQueueTable) throw new Error('DB not initialized');
    return mutationQueueTable;
}

/**
 * Add a request to the mutation queue
 */
export async function queueMutation(mutationKey: string, variables: any) {
    const table = await getQueueTable();
    const dbInstance = await initOfflineDb();

    const row = table.createRow({
        id: crypto.randomUUID(),
        mutationKey,
        variables,
        createdAt: new Date(),
    });

    await dbInstance.insertOrReplace().into(table).values([row]).exec();
    console.log('[OfflineDB] Queued mutation:', mutationKey);
}

/**
 * Get all queued mutations
 */
export async function getQueuedMutations(): Promise<MutationRequest[]> {
    const table = await getQueueTable();
    const dbInstance = await initOfflineDb();

    const results = await dbInstance.select()
        .from(table)
        .orderBy(table['createdAt'], lf.Order.ASC)
        .exec();

    return results as MutationRequest[];
}

/**
 * Remove a mutation from queue (after successful sync)
 */
export async function removeMutationFromQueue(id: string) {
    const table = await getQueueTable();
    const dbInstance = await initOfflineDb();

    await dbInstance.delete().from(table).where(table['id'].eq(id)).exec();
    console.log('[OfflineDB] Removed mutation:', id);
}
