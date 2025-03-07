"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsonDb_1 = require("../src/lib/jsonDb");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminUser, levels, _i, levels_1, level, existingLevel, skills, _a, skills_1, skill, existingSkill;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // Initialize the JSON database
                return [4 /*yield*/, (0, jsonDb_1.initializeDb)()];
                case 1:
                    // Initialize the JSON database
                    _b.sent();
                    return [4 /*yield*/, jsonDb_1.db.user.upsert({ username: 'admin' }, {}, {
                            username: 'admin',
                            level: 0,
                            experience: 0,
                        })];
                case 2:
                    adminUser = _b.sent();
                    console.log('Admin user created:', adminUser);
                    levels = [
                        { name: 'Level 1', experienceNeeded: 10, newSkillCount: 2 },
                        { name: 'Level 2', experienceNeeded: 10, newSkillCount: 2 },
                        { name: 'Level 3', experienceNeeded: 10, newSkillCount: 2 },
                        { name: 'Level 4', experienceNeeded: 10, newSkillCount: 2 },
                        { name: 'Level 5', experienceNeeded: 10, newSkillCount: 2 },
                    ];
                    _i = 0, levels_1 = levels;
                    _b.label = 3;
                case 3:
                    if (!(_i < levels_1.length)) return [3 /*break*/, 9];
                    level = levels_1[_i];
                    return [4 /*yield*/, jsonDb_1.db.level.findFirst({
                            where: { name: level.name }
                        })];
                case 4:
                    existingLevel = _b.sent();
                    if (!existingLevel) return [3 /*break*/, 6];
                    // Update existing level
                    return [4 /*yield*/, jsonDb_1.db.level.update({
                            where: { id: existingLevel.id },
                            data: level,
                        })];
                case 5:
                    // Update existing level
                    _b.sent();
                    return [3 /*break*/, 8];
                case 6: 
                // Create new level
                return [4 /*yield*/, jsonDb_1.db.level.create({
                        data: level,
                    })];
                case 7:
                    // Create new level
                    _b.sent();
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 3];
                case 9:
                    console.log('Levels created');
                    skills = [
                        { name: 'Clean chairs', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Water plants', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Doors', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Edges', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Clean Counters', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Vacuum', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Sweep', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Mop', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Put away dishes', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                        { name: 'Garbage Can', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
                    ];
                    _a = 0, skills_1 = skills;
                    _b.label = 10;
                case 10:
                    if (!(_a < skills_1.length)) return [3 /*break*/, 16];
                    skill = skills_1[_a];
                    return [4 /*yield*/, jsonDb_1.db.skill.findFirst({
                            where: { name: skill.name }
                        })];
                case 11:
                    existingSkill = _b.sent();
                    if (!existingSkill) return [3 /*break*/, 13];
                    // Update existing skill
                    return [4 /*yield*/, jsonDb_1.db.skill.update({
                            where: { id: existingSkill.id },
                            data: skill,
                        })];
                case 12:
                    // Update existing skill
                    _b.sent();
                    return [3 /*break*/, 15];
                case 13: 
                // Create new skill
                return [4 /*yield*/, jsonDb_1.db.skill.create({
                        data: skill,
                    })];
                case 14:
                    // Create new skill
                    _b.sent();
                    _b.label = 15;
                case 15:
                    _a++;
                    return [3 /*break*/, 10];
                case 16:
                    console.log('Skills created');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
});
