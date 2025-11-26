import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    svgPath: '<rect x="10" y="10" width="80" height="80" fill="currentColor"/>',
    defaultColor: '#ec4899',
  },
  {
    name: 'Triangle',
    category: 'geometric',
    type: 'shape',
    svgPath: '<polygon points="50,10 90,90 10,90" fill="currentColor"/>',
    defaultColor: '#f59e0b',
  },
  {
    name: 'Heart',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,85 C50,85 10,50 10,30 C10,15 20,10 30,10 C40,10 50,20 50,30 C50,20 60,10 70,10 C80,10 90,15 90,30 C90,50 50,85 50,85 Z" fill="currentColor"/>',
    defaultColor: '#ef4444',
  },
  {
    name: 'Star',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,10 L61,38 L90,38 L68,56 L79,84 L50,66 L21,84 L32,56 L10,38 L39,38 Z" fill="currentColor"/>',
    defaultColor: '#fbbf24',
  },
  {
    name: 'Diamond',
    category: 'geometric',
    type: 'shape',
    svgPath: '<path d="M50,10 L90,50 L50,90 L10,50 Z" fill="currentColor"/>',
    defaultColor: '#3b82f6',
  },
  {
    name: 'Flower',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,20 C45,20 40,25 40,30 C40,35 45,40 50,40 C55,40 60,35 60,30 C60,25 55,20 50,20 M30,40 C25,40 20,45 20,50 C20,55 25,60 30,60 C35,60 40,55 40,50 C40,45 35,40 30,40 M70,40 C65,40 60,45 60,50 C60,55 65,60 70,60 C75,60 80,55 80,50 C80,45 75,40 70,40 M50,60 C45,60 40,65 40,70 C40,75 45,80 50,80 C55,80 60,75 60,70 C60,65 55,60 50,60 M50,50 C45,50 40,45 40,40 C40,35 45,30 50,30 C55,30 60,35 60,40 C60,45 55,50 50,50" fill="currentColor"/>',
    defaultColor: '#10b981',
  },
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
    name: 'Ring',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="8"/>',
    defaultColor: '#fbbf24',
  },
  {
    name: 'Leaf',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,10 C30,10 20,30 20,50 C20,70 30,80 50,80 C70,80 80,70 80,50 C80,30 70,10 50,10 M50,30 C60,30 70,40 70,50 C70,60 60,70 50,70 C40,70 30,60 30,50 C30,40 40,30 50,30" fill="currentColor"/>',
    defaultColor: '#10b981',
  },
  {
    name: 'Sparkle',
    category: 'decorative',
    type: 'symbol',
    svgPath: '<path d="M50,10 L52,40 L50,50 L48,40 Z M90,50 L60,48 L50,50 L60,52 Z M50,90 L48,60 L50,50 L52,60 Z M10,50 L40,52 L50,50 L40,48 Z" fill="currentColor"/>',
    defaultColor: '#fbbf24',
  },
]

export async function seedShapes() {
  console.log('🌱 Seeding design shapes and symbols...')
  console.log('This will add default shapes and symbols to the database.')

  try {
    // Check for existing shapes
    const existingCount = await prisma.designShape.count()
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

