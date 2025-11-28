import { prisma } from '../src/lib/prisma'

interface ShapeData {
  name: string
  category: string
  type: 'shape' | 'symbol'
  svgPath: string
  defaultColor: string
}

const defaultShapes: ShapeData[] = [
  // Geometric Shapes
  {
    name: 'Circle',
    category: 'geometric',
    type: 'shape',
    svgPath: '<circle cx="50" cy="50" r="40" fill="currentColor"/>',
    defaultColor: '#9333ea',
  },
  {
    name: 'Square',
    category: 'geometric',
    type: 'shape',
    svgPath: '<rect x="10" y="10" width="80" height="80" rx="5" fill="currentColor"/>',
    defaultColor: '#ec4899',
  },
  {
    name: 'Rounded Square',
    category: 'geometric',
    type: 'shape',
    svgPath: '<rect x="10" y="10" width="80" height="80" rx="15" fill="currentColor"/>',
    defaultColor: '#8b5cf6',
  },
  {
    name: 'Triangle',
    category: 'geometric',
    type: 'shape',
    svgPath: '<polygon points="50,10 90,90 10,90" fill="currentColor"/>',
    defaultColor: '#f59e0b',
  },
  {
    name: 'Diamond',
    category: 'geometric',
    type: 'shape',
    svgPath: '<path d="M50,10 L90,50 L50,90 L10,50 Z" fill="currentColor"/>',
    defaultColor: '#3b82f6',
  },
  {
    name: 'Hexagon',
    category: 'geometric',
    type: 'shape',
    svgPath: '<polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="currentColor"/>',
    defaultColor: '#06b6d4',
  },
  {
    name: 'Octagon',
    category: 'geometric',
    type: 'shape',
    svgPath: '<polygon points="50,10 75,15 90,30 90,50 75,65 50,70 25,65 10,50 10,30 25,15" fill="currentColor"/>',
    defaultColor: '#6366f1',
  },
  {
    name: 'Oval',
    category: 'geometric',
    type: 'shape',
    svgPath: '<ellipse cx="50" cy="50" rx="40" ry="30" fill="currentColor"/>',
    defaultColor: '#ec4899',
  },
  
  // Love & Hearts
  {
    name: 'Heart',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,85 C50,85 10,50 10,30 C10,15 20,10 30,10 C40,10 50,20 50,30 C50,20 60,10 70,10 C80,10 90,15 90,30 C90,50 50,85 50,85 Z" fill="currentColor"/>',
    defaultColor: '#ef4444',
  },
  {
    name: 'Love Heart',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,88 C50,88 5,50 5,28 C5,12 18,5 32,5 C42,5 50,15 50,25 C50,15 58,5 68,5 C82,5 95,12 95,28 C95,50 50,88 50,88 Z" fill="currentColor"/>',
    defaultColor: '#f43f5e',
  },
  {
    name: 'Double Heart',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M35,75 C35,75 10,50 10,30 C10,18 18,10 28,10 C36,10 42,18 42,28 C42,18 48,10 56,10 C66,10 74,18 74,30 C74,50 49,75 49,75 M65,75 C65,75 40,50 40,30 C40,18 48,10 58,10 C66,10 72,18 72,28 C72,18 78,10 86,10 C96,10 104,18 104,30 C104,50 79,75 79,75" fill="currentColor"/>',
    defaultColor: '#ec4899',
  },
  
  // Flowers
  {
    name: 'Flower',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<circle cx="50" cy="50" r="8" fill="currentColor"/><circle cx="30" cy="30" r="6" fill="currentColor"/><circle cx="70" cy="30" r="6" fill="currentColor"/><circle cx="30" cy="70" r="6" fill="currentColor"/><circle cx="70" cy="70" r="6" fill="currentColor"/><circle cx="50" cy="20" r="5" fill="currentColor"/><circle cx="50" cy="80" r="5" fill="currentColor"/><circle cx="20" cy="50" r="5" fill="currentColor"/><circle cx="80" cy="50" r="5" fill="currentColor"/>',
    defaultColor: '#10b981',
  },
  {
    name: 'Rose',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,50 C45,45 35,40 30,35 C25,30 20,25 20,20 C20,15 25,10 30,10 C35,10 40,15 40,20 C40,15 45,10 50,10 C55,10 60,15 60,20 C60,15 65,10 70,10 C75,10 80,15 80,20 C80,25 75,30 70,35 C65,40 55,45 50,50 Z" fill="currentColor"/>',
    defaultColor: '#f43f5e',
  },
  {
    name: 'Tulip',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,20 C45,20 40,25 40,30 C40,35 45,40 50,40 C55,40 60,35 60,30 C60,25 55,20 50,20 M50,40 L50,80 M40,80 L60,80" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>',
    defaultColor: '#ec4899',
  },
  {
    name: 'Sunflower',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<circle cx="50" cy="50" r="12" fill="#fbbf24"/><circle cx="50" cy="50" r="8" fill="currentColor"/><path d="M50,20 L52,35 L50,38 L48,35 Z M80,50 L65,52 L62,50 L65,48 Z M50,80 L48,65 L50,62 L52,65 Z M20,50 L35,48 L38,50 L35,52 Z M65,25 L55,30 L53,28 L58,23 Z M85,65 L75,60 L73,62 L78,67 Z M35,75 L45,70 L47,72 L42,77 Z M15,35 L25,40 L23,42 L18,37 Z" fill="currentColor"/>',
    defaultColor: '#f59e0b',
  },
  
  // Stars & Sparkles
  {
    name: 'Star',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,10 L61,38 L90,38 L68,56 L79,84 L50,66 L21,84 L32,56 L10,38 L39,38 Z" fill="currentColor"/>',
    defaultColor: '#fbbf24',
  },
  {
    name: 'Sparkle',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,5 L52,40 L50,50 L48,40 Z M95,50 L60,48 L50,50 L60,52 Z M50,95 L48,60 L50,50 L52,60 Z M5,50 L40,52 L50,50 L40,48 Z" fill="currentColor"/>',
    defaultColor: '#fbbf24',
  },
  {
    name: 'Star Outline',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,10 L61,38 L90,38 L68,56 L79,84 L50,66 L21,84 L32,56 L10,38 L39,38 Z" fill="none" stroke="currentColor" stroke-width="3"/>',
    defaultColor: '#fbbf24',
  },
  
  // Leaves & Nature
  {
    name: 'Leaf',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,10 C30,10 15,25 15,45 C15,60 25,75 50,90 C75,75 85,60 85,45 C85,25 70,10 50,10 M50,30 C60,30 70,40 70,50 C70,60 60,70 50,70 C40,70 30,60 30,50 C30,40 40,30 50,30" fill="currentColor"/>',
    defaultColor: '#10b981',
  },
  {
    name: 'Clover',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<circle cx="50" cy="50" r="5" fill="currentColor"/><circle cx="30" cy="30" r="8" fill="currentColor"/><circle cx="70" cy="30" r="8" fill="currentColor"/><circle cx="30" cy="70" r="8" fill="currentColor"/><circle cx="70" cy="70" r="8" fill="currentColor"/>',
    defaultColor: '#10b981',
  },
  
  // Rings & Circles
  {
    name: 'Ring',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="8"/>',
    defaultColor: '#fbbf24',
  },
  {
    name: 'Double Ring',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="4"/>',
    defaultColor: '#fbbf24',
  },
  {
    name: 'Circle Outline',
    category: 'geometric',
    type: 'shape',
    svgPath: '<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="6"/>',
    defaultColor: '#9333ea',
  },
  
  // Arrows & Directions
  {
    name: 'Arrow Right',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M20,50 L70,50 M60,30 L70,50 L60,70" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    defaultColor: '#6366f1',
  },
  {
    name: 'Arrow Left',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M80,50 L30,50 M40,30 L30,50 L40,70" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    defaultColor: '#6366f1',
  },
  {
    name: 'Arrow Up',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M50,80 L50,30 M30,40 L50,30 L70,40" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    defaultColor: '#6366f1',
  },
  {
    name: 'Arrow Down',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M50,20 L50,70 M30,60 L50,70 L70,60" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    defaultColor: '#6366f1',
  },
  
  // Icons & Symbols
  {
    name: 'Checkmark',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M20,50 L40,70 L80,30" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    defaultColor: '#10b981',
  },
  {
    name: 'Plus',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M50,20 L50,80 M20,50 L80,50" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>',
    defaultColor: '#6366f1',
  },
  {
    name: 'Minus',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M20,50 L80,50" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>',
    defaultColor: '#6366f1',
  },
  {
    name: 'X',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M20,20 L80,80 M80,20 L20,80" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>',
    defaultColor: '#ef4444',
  },
  {
    name: 'Infinity',
    category: 'symbols',
    type: 'symbol',
    svgPath: '<path d="M30,50 C30,40 35,35 40,35 C45,35 50,40 50,50 C50,60 55,65 60,65 C65,65 70,60 70,50 M70,50 C70,60 65,65 60,65 C55,65 50,60 50,50 C50,40 45,35 40,35 C35,35 30,40 30,50" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    defaultColor: '#8b5cf6',
  },
]

export async function seedShapes() {
  console.log('🌱 Seeding design shapes and symbols...')
  console.log('This will add default shapes and symbols to the database.')

  try {
    // Check if DesignShape model exists in Prisma client
    if (!prisma.designShape) {
      console.error('❌ Error: DesignShape model not found in Prisma client.')
      console.error('   Please run: npx prisma generate')
      throw new Error('DesignShape model not found. Run "npx prisma generate" first.')
    }

    // Check for existing shapes - create table if it doesn't exist
    let existingCount = 0
    try {
      existingCount = await prisma.designShape.count()
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        console.log('⚠️  DesignShape table does not exist. Creating it now...')
        
        // Create the table using raw SQL (single statement)
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "DesignShape" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "category" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "svgPath" TEXT NOT NULL,
            "defaultColor" TEXT NOT NULL DEFAULT '#9333ea',
            "isDefault" BOOLEAN NOT NULL DEFAULT true,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "DesignShape_pkey" PRIMARY KEY ("id")
          )
        `)
        
        // Create indexes (separate statements)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DesignShape_category_idx" ON "DesignShape"("category")`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DesignShape_type_idx" ON "DesignShape"("type")`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DesignShape_isActive_idx" ON "DesignShape"("isActive")`)
        
        console.log('✅ DesignShape table created successfully!')
        existingCount = 0
      } else {
        throw error
      }
    }
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing shape(s) in database.`)
      console.log('Shapes will be updated if they exist, or added if new.')
    }

    let created = 0
    let updated = 0

    for (const shape of defaultShapes) {
      const existing = await prisma.designShape.findFirst({
        where: {
          name: shape.name,
          category: shape.category,
        },
      })

      if (existing) {
        await prisma.designShape.update({
          where: { id: existing.id },
          data: {
            type: shape.type,
            svgPath: shape.svgPath,
            defaultColor: shape.defaultColor,
          },
        })
        updated++
      } else {
        await prisma.designShape.create({
          data: {
            name: shape.name,
            category: shape.category,
            type: shape.type,
            svgPath: shape.svgPath,
            defaultColor: shape.defaultColor,
            isDefault: true,
            isActive: true,
          },
        })
        created++
      }
    }

    const total = await prisma.designShape.count()
    console.log(`✅ Shapes seeded successfully!`)
    console.log(`   Created: ${created}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Total shapes in database: ${total}`)
    console.log('\nShapes are now available to all users in the invitation editor.')
  } catch (error) {
    console.error('❌ Error seeding shapes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedShapes()
    .then(() => {
      console.log('\n✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed to seed shapes:', error)
      process.exit(1)
    })
}


