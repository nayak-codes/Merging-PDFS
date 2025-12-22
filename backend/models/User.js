import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false // Don't return password by default
    },
    profileImage: {
        type: String,
        default: null
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    subscription: {
        type: String,
        enum: ['free', 'premium', 'enterprise'],
        default: 'free'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
    return {
        id: this._id,
        fullName: this.fullName,
        email: this.email,
        profileImage: this.profileImage,
        subscription: this.subscription,
        accountStatus: this.accountStatus,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);

export default User;
