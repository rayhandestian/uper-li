import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline/promises'
import { stdin as input, stdout as output } from 'process'

const prisma = new PrismaClient()

async function createFirstAdmin() {
    const rl = readline.createInterface({ input, output })

    console.log('\n===========================================')
    console.log('      Admin Account Creation Script')
    console.log('===========================================\n')

    try {
        // Check if any admins already exist
        const existingAdmins = await prisma.admin.count()
        if (existingAdmins > 0) {
            console.log('⚠️  Admin accounts already exist in the database.')
            const proceed = await rl.question('Do you want to create another admin? (y/N): ')
            if (proceed.toLowerCase() !== 'y') {
                console.log('\nCancelled.')
                rl.close()
                await prisma.$disconnect()
                return
            }
        }

        // Get admin details
        const email = await rl.question('\nEnter admin email (default: admin@uper.li): ')
        const finalEmail = email.trim() || 'admin@uper.li'

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(finalEmail)) {
            console.error('\n❌ Invalid email format')
            rl.close()
            await prisma.$disconnect()
            return
        }

        // Check if email already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: finalEmail }
        })
        if (existingAdmin) {
            console.error(`\n❌ An admin with email ${finalEmail} already exists`)
            rl.close()
            await prisma.$disconnect()
            return
        }

        const name = await rl.question('Enter admin name (default: System Administrator): ')
        const finalName = name.trim() || 'System Administrator'

        // Get password with validation
        let password = ''
        let confirmPassword = ''
        let passwordValid = false

        while (!passwordValid) {
            password = await rl.question('\nEnter password (min 12 characters): ')

            if (password.length < 12) {
                console.log('❌ Password must be at least 12 characters long')
                continue
            }

            confirmPassword = await rl.question('Confirm password: ')

            if (password !== confirmPassword) {
                console.log('❌ Passwords do not match')
                continue
            }

            passwordValid = true
        }

        // Hash password
        console.log('\n⏳ Creating admin account...')
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create admin
        const admin = await prisma.admin.create({
            data: {
                email: finalEmail,
                name: finalName,
                password: hashedPassword,
                twoFactorEnabled: true,
                active: true
            }
        })

        console.log('\n✅ Admin account created successfully!')
        console.log('\n===========================================')
        console.log('           Account Details')
        console.log('===========================================')
        console.log(`Email:    ${admin.email}`)
        console.log(`Name:     ${admin.name}`)
        console.log(`2FA:      Enabled`)
        console.log(`Status:   Active`)
        console.log('===========================================\n')
        console.log('You can now log in at: http://localhost:3000/login-admin')
        console.log('(or https://admin.uper.li in production)\n')

    } catch (error) {
        console.error('\n❌ Error creating admin:', error)
    } finally {
        rl.close()
        await prisma.$disconnect()
    }
}

createFirstAdmin()
