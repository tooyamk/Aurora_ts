#pragma once

#include <iostream>
#include "fbxsdk.h"

class Converter {
public:
	Converter();
	~Converter();

	void parse(std::string filePath);

private:
	FbxManager* _manager;

	void _parseNode(FbxNode* node);
	void _parseMesh(FbxNode* node);
	void _parseSkeleton(FbxNode* node);
};